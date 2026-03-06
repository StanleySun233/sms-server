'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { smsApi } from '@/lib/api';
import { SmsMessage, Conversation } from '@/lib/types';
import MessageBubble from '@/components/MessageBubble';
import ConversationList from '@/components/ConversationList';
import ExportButton from '@/components/ExportButton';

export default function ConversationPage() {
  const t = useTranslations('messages');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);
  const receiverPhone = decodeURIComponent(params.phone as string);

  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewRow, setShowNewRow] = useState(false);
  const [newConversationPhone, setNewConversationPhone] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [toast, setToast] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const unreadMessagesRef = useRef<Set<number>>(new Set());
  const messagesRef = useRef<SmsMessage[]>([]);

  const fetchConversations = async () => {
    const response = await smsApi.getConversations(deviceId, receiverPhone);
    const list = response.data.data || [];
    setConversations(list);
    if (list.length > 0 && !selectedSender) {
      setSelectedSender(list[0].phone);
    }
  };

  const fetchMessages = async (resetPage: boolean = false) => {
    if (!selectedSender) {
      setLoading(false);
      return;
    }
    const currentPage = resetPage ? 1 : page;
    const response = await smsApi.getMessages(deviceId, selectedSender, currentPage, 50, receiverPhone);
    const data = response.data.data;
    if (data && data.records) {
      const records = data.records as SmsMessage[];
      if (resetPage) {
        setMessages(records.reverse());
      } else {
        const newMsgs = records.filter((msg: SmsMessage) => !messages.find((m) => m.id === msg.id));
        if (newMsgs.length > 0) {
          setMessages([...messages, ...newMsgs.reverse()]);
        }
      }
      setHasMore(!data.last);
    }
    setLoading(false);
  };

  const markMessagesAsRead = async (messageIds: number[]) => {
    const current = messagesRef.current;
    const unreadIds = messageIds.filter((id) => {
      const msg = current.find((m) => m.id === id);
      return msg && !msg.readAt;
    });
    if (unreadIds.length === 0) return;
    await smsApi.markAsRead(unreadIds);
    setMessages((prev) =>
      prev.map((msg) =>
        unreadIds.includes(msg.id) ? { ...msg, readAt: new Date().toISOString() } : msg
      )
    );
  };

  useEffect(() => {
    fetchConversations();
  }, [deviceId, receiverPhone]);

  useEffect(() => {
    if (selectedSender && selectedSender !== '__new__') {
      setLoading(true);
      setMessages([]);
      setPage(1);
      fetchMessages(true);
    } else {
      setLoading(false);
      setMessages([]);
    }
  }, [deviceId, receiverPhone, selectedSender]);

  const mergeMessagesFromRecords = (records: SmsMessage[]) => {
    if (!records.length) return;
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      for (const r of records) {
        const existing = byId.get(r.id);
        if (existing) {
          if (existing.status !== r.status || existing.updatedAt !== r.updatedAt) {
            byId.set(r.id, { ...existing, status: r.status, updatedAt: r.updatedAt });
          }
        } else {
          byId.set(r.id, r);
        }
      }
      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  };

  useEffect(() => {
    if (!selectedSender || selectedSender === '__new__') return;
    const tick = async () => {
      const response = await smsApi.getMessages(deviceId, selectedSender, 1, 50, receiverPhone);
      const data = response.data.data;
      if (data?.records?.length) mergeMessagesFromRecords(data.records as SmsMessage[]);
    };
    const interval = setInterval(tick, 30000);
    const onFocus = () => tick();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [deviceId, receiverPhone, selectedSender]);

  useEffect(() => {
    if (!selectedSender || selectedSender === '__new__') return;
    const t = setTimeout(() => {
      smsApi.getMessages(deviceId, selectedSender, 1, 50, receiverPhone).then((res) => {
        const data = res.data.data;
        if (data?.records?.length) mergeMessagesFromRecords(data.records as SmsMessage[]);
      });
    }, 2000);
    return () => clearTimeout(t);
  }, [deviceId, receiverPhone, selectedSender]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
            const direction = entry.target.getAttribute('data-direction');
            if (messageId && direction === 'received') {
              unreadMessagesRef.current.add(messageId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );
    const messageBubbles = document.querySelectorAll('[data-message-id]');
    messageBubbles.forEach((bubble) => observer.observe(bubble));
    return () => observer.disconnect();
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (unreadMessagesRef.current.size > 0) {
        const messageIds = Array.from(unreadMessagesRef.current);
        unreadMessagesRef.current.clear();
        markMessagesAsRead(messageIds);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = selectedSender === '__new__' ? newConversationPhone.trim() : selectedSender;
    if (!phone || !newMessage.trim() || sending) return;
    setSending(true);
    const res = await smsApi.sendMessage(deviceId, { phone, content: newMessage.trim() });
    setNewMessage('');
    setToast(t('sendSuccess'));
    setTimeout(() => setToast(''), 2000);
    if (selectedSender === '__new__') {
      setSelectedSender(phone);
      setNewConversationPhone('');
      setShowNewRow(false);
      fetchConversations();
    } else {
      const created = res.data?.data as SmsMessage | undefined;
      if (created?.id) {
        setMessages((prev) => [...prev, created]);
      } else {
        setTimeout(() => fetchMessages(false), 1000);
      }
    }
    setSending(false);
  };

  const handleSelectConversation = (phone: string) => {
    setSelectedSender(phone);
    if (phone !== '__new__') setShowNewRow(false);
  };

  if (loading && !selectedSender) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-white text-xl">{tCommon('loading')}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 p-4">
      {toast && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-white text-sm"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          {toast}
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0 mx-auto w-full max-w-6xl">
        <div className="flex gap-4 flex-1 min-h-0">
          <div
            className="w-80 shrink-0 flex flex-col rounded-2xl shadow-xl overflow-hidden min-h-0"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex justify-between items-center">
                <button
                  onClick={() => router.push(`/devices/${deviceId}/messages`)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  ← {t('backToDevice')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewRow(true);
                    setSelectedSender('__new__');
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm text-white transition-colors"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  {t('new')}
                </button>
              </div>
              <div className="text-xs text-white/50 mt-1">
                {(receiverPhone === '__unknown__' || receiverPhone === 'none') ? t('noReceiver') : receiverPhone}
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <ConversationList
              conversations={conversations}
              selectedPhone={selectedSender ?? undefined}
              onSelectConversation={handleSelectConversation}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              prependEmptyRow={showNewRow}
              onSelectEmptyRow={() => setSelectedSender('__new__')}
            />
            </div>
          </div>

          <div
            className="flex-1 min-h-0 rounded-2xl shadow-xl flex flex-col overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div
              className="p-4 flex justify-between items-center gap-2"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {selectedSender === '__new__' ? (
                <input
                  type="text"
                  value={newConversationPhone}
                  onChange={(e) => setNewConversationPhone(e.target.value)}
                  placeholder={t('newPhonePlaceholder')}
                  className="flex-1 min-w-0 px-4 py-2 rounded-lg text-white placeholder-white/50 text-2xl font-semibold"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                />
              ) : (
                <h2 className="text-2xl font-semibold text-white">
                  {selectedSender ?? t('noConversations')}
                </h2>
              )}
              {selectedSender && selectedSender !== '__new__' && (
                <ExportButton
                  deviceId={deviceId}
                  receiverPhone={receiverPhone}
                  phone={selectedSender}
                />
              )}
            </div>

            <div
              ref={messagesContainerRef}
              className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2"
              style={{ scrollBehavior: 'smooth' }}
            >
              {!selectedSender || selectedSender === '__new__' ? (
                <div className="text-white/50 text-center mt-8">
                  {selectedSender === '__new__' ? t('noMessages') : t('noConversations')}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-white/50 text-center mt-8">{t('noMessages')}</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    data-message-id={message.id}
                    data-direction={message.direction}
                  >
                    <MessageBubble
                      message={message}
                      deviceId={deviceId}
                      onRetry={(id) => {
                        smsApi.retryMessage(deviceId, id).then(() => {
                          setMessages((prev) =>
                            prev.map((m) => (m.id === id ? { ...m, status: 'pending' as const } : m))
                          );
                        });
                      }}
                    />
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {selectedSender ? (
              <form
                onSubmit={handleSendMessage}
                className="p-4"
                style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t('placeholderMessage')}
                    disabled={sending}
                    className="flex-1 px-4 py-3 rounded-lg text-white placeholder-white/50"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim() || (selectedSender === '__new__' && !newConversationPhone.trim())}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
                    style={{
                      backgroundColor: '#c2905e',
                      color: '#fff',
                    }}
                  >
                    {sending ? t('sending') : t('send')}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

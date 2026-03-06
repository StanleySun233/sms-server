'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ElMessage } from 'element-plus';
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
  const phone = decodeURIComponent(params.phone as string);

  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const unreadMessagesRef = useRef<Set<number>>(new Set());

  const fetchConversations = async () => {
    const response = await smsApi.getConversations(deviceId);
    setConversations(response.data.data || []);
  };

  const fetchMessages = async (resetPage: boolean = false) => {
    const currentPage = resetPage ? 1 : page;
    const response = await smsApi.getMessages(deviceId, phone, currentPage, 50);
    const data = response.data.data;
    if (data && data.records) {
      if (resetPage) {
        setMessages(data.records.reverse());
      } else {
        const newMsgs = data.records.filter(
          (msg: SmsMessage) => !messages.find((m) => m.id === msg.id)
        );
        if (newMsgs.length > 0) {
          setMessages([...messages, ...newMsgs.reverse()]);
        }
      }
      setHasMore(!data.last);
    }
    setLoading(false);
  };

  const markMessagesAsRead = async (messageIds: number[]) => {
    await smsApi.markAsRead(messageIds);
    setMessages((prev) =>
      prev.map((msg) =>
        messageIds.includes(msg.id) ? { ...msg, readAt: new Date().toISOString() } : msg
      )
    );
    fetchConversations();
  };

  useEffect(() => {
    fetchConversations();
  }, [deviceId]);

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 5000);
    return () => clearInterval(interval);
  }, [deviceId, phone]);

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
        markMessagesAsRead(messageIds);
        unreadMessagesRef.current.clear();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSending(true);
    await smsApi.sendMessage(deviceId, { phone, content: newMessage.trim() });
    setNewMessage('');
    ElMessage.success(t('sendSuccess'));
    setTimeout(() => fetchMessages(false), 1000);
    setSending(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">{tCommon('loading')}</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="container mx-auto px-4 py-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex gap-4 h-full">
          <div
            className="w-80 rounded-2xl shadow-xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div className="p-4 border-b border-white/10">
              <button
                onClick={() => router.push(`/devices/${deviceId}`)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ← {t('backToDevice')}
              </button>
            </div>
            <ConversationList
              conversations={conversations}
              selectedPhone={phone}
              onSelectConversation={(selectedPhone) =>
                router.push(`/devices/${deviceId}/messages/${encodeURIComponent(selectedPhone)}`)
              }
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          <div
            className="flex-1 rounded-2xl shadow-xl flex flex-col overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <div
              className="p-4 flex justify-between items-center"
              style={{
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h2 className="text-2xl font-semibold text-white">{phone}</h2>
              <ExportButton deviceId={deviceId} phone={phone} />
            </div>

            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-2"
              style={{ scrollBehavior: 'smooth' }}
            >
              {messages.length === 0 ? (
                <div className="text-white/50 text-center mt-8">{t('noMessages')}</div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    data-message-id={message.id}
                    data-direction={message.direction}
                  >
                    <MessageBubble message={message} />
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

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
                  disabled={sending || !newMessage.trim()}
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
          </div>
        </div>
      </div>
    </div>
  );
}

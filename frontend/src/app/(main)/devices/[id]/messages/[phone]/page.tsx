'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { deviceApi, identifySmsDraft, smsApi, type SmsDraft } from '@/lib/api';
import { SmsMessage, Conversation } from '@/lib/types';
import MessageBubble from '@/components/MessageBubble';
import ConversationList from '@/components/ConversationList';
import ExportButton from '@/components/ExportButton';
import { decodeRouteSegment } from '@/lib/utils';

export default function ConversationPage() {
  const params = useParams<{ id: string; phone: string }>();
  const phone = decodeRouteSegment(params.phone);
  return <ConversationScreen key={JSON.stringify([params.id, phone])}
    deviceId={Number(params.id)} receiverPhone={phone} />;
}

function ConversationScreen({ deviceId, receiverPhone }: { deviceId: number; receiverPhone: string }) {
  const t = useTranslations('messages');
  const tCommon = useTranslations('common');
  const tDevices = useTranslations('devices');
  const router = useRouter();
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [threadError, setThreadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendReady, setSendReady] = useState<boolean>();
  const [currentLine, setCurrentLine] = useState<string>();
  const historicalLine = !!currentLine && receiverPhone !== currentLine;
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const newMessage = selectedSender ? drafts[selectedSender] ?? '' : '';
  const [searchQuery, setSearchQuery] = useState('');
  const [newConversationPhone, setNewConversationPhone] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [toast, setToast] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);
  const [retrying, setRetrying] = useState<number[]>([]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const activeSender = useRef<string | null>(null);
  const threadRequest = useRef<AbortController | null>(null);
  const fetchingLatest = useRef(false);
  const listRequest = useRef<AbortController | null>(null);
  const olderPage = useRef(1);
  const scrollAdjustment = useRef<{ height: number; top: number } | 'end' | null>(null);
  const sendDrafts = useRef(new Map<string, SmsDraft>());

  const selectSender = useCallback((phone: string, open = true) => {
    if (activeSender.current !== phone) {
      threadRequest.current?.abort();
      activeSender.current = phone;
      olderPage.current = 1;
      scrollAdjustment.current = null;
      setSelectedSender(phone);
      setMessages([]);
      setThreadError(false);
      setHasMore(false);
      setLoadingOlder(false);
      setLoading(phone !== '__new__');
    }
    if (open) setShowConversationList(false);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (listRequest.current) return;
    const request = new AbortController();
    listRequest.current = request;
    try {
      const response = await smsApi.getConversations(deviceId, receiverPhone, request.signal);
      if (request.signal.aborted) return;
      const list: Conversation[] = response.data.data ?? [];
      setConversations(list);
      setListError(false);
      if (!activeSender.current && list[0]) selectSender(list[0].phone, false);
    } catch {
      if (!request.signal.aborted) setListError(true);
    } finally {
      if (listRequest.current === request) listRequest.current = null;
      if (!request.signal.aborted) setListLoading(false);
    }
  }, [deviceId, receiverPhone, selectSender]);

  const fetchMessages = useCallback(async (mode: 'initial' | 'latest' | 'older') => {
    const sender = activeSender.current;
    if (!sender || sender === '__new__') return;
    if (threadRequest.current && !threadRequest.current.signal.aborted) {
      if (mode !== 'older' || !fetchingLatest.current) return;
      threadRequest.current.abort();
    }
    const request = new AbortController();
    threadRequest.current = request;
    fetchingLatest.current = mode === 'latest';
    if (mode === 'initial') setLoading(true);
    if (mode === 'older') setLoadingOlder(true);
    const page = mode === 'older' ? olderPage.current + 1 : 1;
    try {
      const { data } = await smsApi.getMessages(deviceId, sender, page, 50, receiverPhone, request.signal);
      if (request.signal.aborted) return;
      const box = messagesContainerRef.current;
      if (mode === 'older' && box) {
        scrollAdjustment.current = { height: box.scrollHeight, top: box.scrollTop };
      } else if (mode === 'initial' || (box && box.scrollHeight - box.clientHeight - box.scrollTop < 80)) {
        scrollAdjustment.current = 'end';
      }
      const records: SmsMessage[] = data.data.records;
      setMessages((previous) => {
        const byId = new Map(previous.map((message) => [message.id, message]));
        for (const row of records) {
          const prior = byId.get(row.id);
          if (!prior || row.updatedAt >= prior.updatedAt) {
            byId.set(row.id, { ...row, readAt: row.readAt ?? prior?.readAt });
          }
        }
        return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id);
      });
      if (mode !== 'latest' || olderPage.current === 1) {
        olderPage.current = page;
        setHasMore(!data.data.last);
      }
      setThreadError(false);
    } catch {
      if (!request.signal.aborted) setThreadError(true);
    } finally {
      if (threadRequest.current === request) {
        threadRequest.current = null;
        fetchingLatest.current = false;
      }
      if (!request.signal.aborted) {
        setLoading(false);
        setLoadingOlder(false);
      }
    }
  }, [deviceId, receiverPhone]);

  useEffect(() => {
    let active = true;
    let checkingDevice = false;
    const refresh = () => {
      if (document.visibilityState === 'hidden') return;
      void fetchConversations();
      if (!checkingDevice) {
        checkingDevice = true;
        void deviceApi.get(deviceId).then(({ data }) => {
          if (active) {
            setSendReady(data.smsSendReady === true);
            setCurrentLine(data.currentPhoneNumber || undefined);
          }
        }).catch(() => {}).finally(() => { checkingDevice = false; });
      }
      void fetchMessages('latest');
    };
    refresh();
    const timer = window.setInterval(refresh, 15000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      listRequest.current?.abort();
      listRequest.current = null;
      threadRequest.current?.abort();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [deviceId, fetchConversations, fetchMessages]);

  useEffect(() => { void fetchMessages('initial'); }, [selectedSender, fetchMessages]);

  useEffect(() => {
    const box = messagesContainerRef.current;
    if (box && !showConversationList && window.matchMedia('(max-width: 767px)').matches) {
      box.scrollTop = box.scrollHeight;
    }
  }, [showConversationList]);

  useEffect(() => {
    const box = messagesContainerRef.current;
    const adjustment = scrollAdjustment.current;
    scrollAdjustment.current = null;
    if (!box || !adjustment) return;
    box.scrollTop = adjustment === 'end' ? box.scrollHeight : adjustment.top + box.scrollHeight - adjustment.height;
  }, [messages]);

  useEffect(() => {
    const box = messagesContainerRef.current;
    if (!box || showConversationList && window.matchMedia('(max-width: 767px)').matches) return;
    const unread = new Set(messages.filter((message) => message.direction === 'received' && !message.readAt).map((message) => message.id));
    if (!unread.size) return;
    const visible = new Set<number>();
    let active = true;
    let pending = false;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = Number((entry.target as HTMLElement).dataset.messageId);
        if (entry.isIntersecting && unread.has(id)) visible.add(id);
        else visible.delete(id);
      }
    }, { root: box, threshold: 0.5 });
    box.querySelectorAll('[data-message-id]').forEach((element) => observer.observe(element));
    const timer = window.setInterval(async () => {
      if (!active || pending || document.hidden || !visible.size) return;
      const ids = [...visible];
      pending = true;
      try {
        await smsApi.markAsRead(ids);
        if (!active) return;
        const readAt = new Date().toISOString();
        setMessages((previous) => previous.map((message) => ids.includes(message.id) ? { ...message, readAt } : message));
        void fetchConversations();
      } catch {
        // Keep the visible messages eligible for the next attempt.
      } finally {
        pending = false;
      }
    }, 2500);
    return () => { active = false; clearInterval(timer); observer.disconnect(); };
  }, [messages, fetchConversations, showConversationList]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const validPhone = /^\+?[0-9]{5,19}$/.test((selectedSender === '__new__' ? newConversationPhone : selectedSender ?? '').trim());

  async function handleSendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!validPhone || !selectedSender || !newMessage.trim() || sending || !sendReady || historicalLine) return;
    const sender = selectedSender;
    const phone = sender === '__new__' ? newConversationPhone.trim() : sender;
    setSending(true);
    try {
      const draft = identifySmsDraft(sendDrafts.current.get(sender) ?? null, deviceId, phone, newMessage.trim());
      sendDrafts.current.set(sender, draft);
      const { data } = await smsApi.sendMessage(deviceId, draft);
      sendDrafts.current.delete(sender);
      setDrafts((previous) => ({ ...previous, [sender]: '' }));
      setToast(t('sendSuccess'));
      if (activeSender.current === sender && sender === '__new__') {
        selectSender(phone);
        setNewConversationPhone('');
      } else if (activeSender.current === sender && data.data?.id) {
        scrollAdjustment.current = 'end';
        setMessages((previous) => previous.some((message) => message.id === data.data.id) ? [...previous] : [...previous, data.data]);
      }
      void fetchConversations();
    } catch (error) {
      setToast(error instanceof Error ? error.message : t('sendFailed'));
    } finally {
      setSending(false);
    }
  }

  async function retryMessage(id: number) {
    const sender = activeSender.current;
    setRetrying((ids) => [...ids, id]);
    try {
      await smsApi.retryMessage(deviceId, id);
      if (activeSender.current === sender) {
        setMessages((previous) => previous.map((message) => message.id === id ? { ...message, status: 'pending' } : message));
      }
      setToast(t('sendSuccess'));
    } catch (error) {
      setToast(error instanceof Error ? error.message : t('sendFailed'));
    } finally {
      setRetrying((ids) => ids.filter((value) => value !== id));
    }
  }
  return (
    <div className="h-full flex flex-col min-h-0 p-4">
      {toast && (
        <div
          role="status"
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
            className={`${showConversationList ? 'flex' : 'hidden'} w-full md:w-72 lg:w-80 md:flex shrink-0 flex-col rounded-2xl shadow-xl overflow-hidden min-h-0`}
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
                  onClick={() => selectSender('__new__')}
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
              {listError && <div role="alert" className="px-4 pt-3 text-sm text-amber-200">
                {t('conversationLoadFailed')} <button type="button" className="underline" onClick={fetchConversations}>{t('retryLoad')}</button>
              </div>}
              {listLoading ? <p role="status" className="p-4 text-white/70">{tCommon('loading')}</p> : (
                <ConversationList
                  conversations={conversations}
                  selectedPhone={selectedSender ?? undefined}
                  onSelectConversation={selectSender}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
              )}
            </div>
          </div>

          <div
            className={`${showConversationList ? 'hidden' : 'flex'} md:flex flex-1 min-w-0 min-h-0 rounded-2xl shadow-xl flex-col overflow-hidden`}
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
              <button type="button" className="md:hidden shrink-0 text-white/80" onClick={() => setShowConversationList(true)}>
                ← {t('conversationList')}
              </button>
              {selectedSender === '__new__' ? (
                <input
                  type="tel"
                  aria-label={t('newPhonePlaceholder')}
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
                <h2 className="min-w-0 break-all text-base sm:text-xl font-semibold text-white">
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
              className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 [overflow-anchor:none]"

            >
              {threadError && <div role="alert" className="pb-2 text-center text-sm text-amber-200">
                {t('threadLoadFailed')} <button type="button" className="underline" onClick={() => fetchMessages(messages.length ? 'latest' : 'initial')}>{t('retryLoad')}</button>
              </div>}
              {hasMore && <div className="text-center">
                <button type="button" className="px-4 py-2 text-sm text-white underline disabled:opacity-60" disabled={loadingOlder} onClick={() => fetchMessages('older')}>
                  {loadingOlder ? tCommon('loading') : t('olderMessages')}
                </button>
              </div>}
              {loading ? <p role="status" className="mt-8 text-center text-white/70">{tCommon('loading')}</p> : !selectedSender || selectedSender === '__new__' ? (
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
                      onRetry={sendReady && !historicalLine && !retrying.includes(message.id) ? retryMessage : undefined}
                    />
                  </div>
                ))
              )}

            </div>

            {selectedSender ? (
              <form
                onSubmit={handleSendMessage}
                className="p-4"
                style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
              >
                {historicalLine ? <p role="status" className="mb-2 text-sm text-amber-200">
                  {t('historicalLine')} <button type="button" className="underline" onClick={() => router.push(`/devices/${deviceId}/messages/${encodeURIComponent(currentLine)}`)}>{t('openCurrentLine')}</button>
                </p> : sendReady === false && <p className="mb-2 text-sm text-amber-200">{tDevices('smsSendNotReady')}</p>}
                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    maxLength={1000}
                    aria-label={t('placeholderMessage')}
                    value={newMessage}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDrafts((previous) => ({ ...previous, [selectedSender]: value }));
                    }}
                    placeholder={t('placeholderMessage')}
                    disabled={sending}
                    className="min-w-0 flex-1 resize-y px-3 py-2 rounded-lg text-white placeholder-white/50"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || !sendReady || historicalLine || !validPhone || !newMessage.trim()}
                    className="shrink-0 px-3 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
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

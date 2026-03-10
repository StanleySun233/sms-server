'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ElMessage } from 'element-plus';
import { smsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/dateUtils';

type SendLogItem = {
  id: number;
  deviceId: number;
  phoneNumber: string;
  content: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const PAGE_SIZE = 20;

export default function DeviceSendPage() {
  const t = useTranslations('devices');
  const tMessages = useTranslations('messages');
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);

  const [sendPhone, setSendPhone] = useState('');
  const [sendContent, setSendContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendLogs, setSendLogs] = useState<SendLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchSendLogs = useCallback((currentPage: number, search: string, isLoadMore: boolean = false) => {
    const loadFunc = isLoadMore ? setLoadingMore : setLogsLoading;
    loadFunc(true);

    smsApi.getSendLogs(deviceId, currentPage, PAGE_SIZE, search || undefined)
      .then((res) => {
        const data = (res.data as { data?: SendLogItem[] })?.data;
        const newLogs = Array.isArray(data) ? data : [];

        if (isLoadMore) {
          setSendLogs(prev => [...prev, ...newLogs]);
        } else {
          setSendLogs(newLogs);
        }

        setHasMore(newLogs.length === PAGE_SIZE);
      })
      .catch((err: Error) => {
        ElMessage.error(err.message || t('loadFailed'));
      })
      .finally(() => loadFunc(false));
  }, [deviceId, t]);

  // Initial load
  useEffect(() => {
    setPage(1);
    fetchSendLogs(1, searchQuery);
  }, [searchQuery]);

  // Load more
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchSendLogs(nextPage, searchQuery, true);
  }, [page, searchQuery, loadingMore, hasMore, fetchSendLogs]);

  // Scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    if (scrollHeight - scrollTop - clientHeight < 100 && !loadingMore && hasMore) {
      loadMore();
    }
  }, [loadMore, loadingMore, hasMore]);

  // Search handler
  const handleSearch = useCallback(() => {
    setPage(1);
    setSearchQuery(searchInput.trim());
  }, [searchInput]);

  const handleSearchKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = sendPhone.trim();
    const content = sendContent.trim();
    if (!phone || !content || sending) return;
    setSending(true);
    smsApi.sendMessage(deviceId, { phone, content })
      .then(() => {
        setSendPhone('');
        setSendContent('');
        ElMessage.success(t('sendQueuedSuccess'));
        // Refresh logs
        setPage(1);
        fetchSendLogs(1, searchQuery);
      })
      .catch((err: Error) => ElMessage.error(err.message || t('loadFailed')))
      .finally(() => setSending(false));
  };

  const statusKey: Record<string, string> = {
    pending: t('statusPending'),
    sent: t('statusSent'),
    delivered: t('statusDelivered'),
    failed: t('statusFailed'),
  };
  const formatTime = (s: string | null) => s ? formatDateTime(s) : '—';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">{t('sendSms')}</h1>
          <button
            onClick={() => router.push(`/devices/${deviceId}`)}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            {tMessages('backToDevice')}
          </button>
        </div>

        <div
          className="rounded-2xl p-8 shadow-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <form onSubmit={handleSendSms} className="space-y-4">
            <div>
              <label className="block text-white/70 mb-2">{t('phone')}</label>
              <input
                type="text"
                value={sendPhone}
                onChange={(e) => setSendPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                disabled={sending}
                className="w-full px-4 py-3 rounded-lg text-white placeholder-white/50"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              />
            </div>
            <div>
              <label className="block text-white/70 mb-2">{t('contentLabel')}</label>
              <textarea
                value={sendContent}
                onChange={(e) => setSendContent(e.target.value)}
                placeholder={t('messagePlaceholder')}
                disabled={sending}
                rows={4}
                className="w-full px-4 py-3 rounded-lg text-white placeholder-white/50 resize-y"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !sendPhone.trim() || !sendContent.trim()}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: '#c2905e',
                color: '#fff',
              }}
            >
              {sending ? t('sending') : t('sendButton')}
            </button>
          </form>
        </div>

        <div
          className="mt-8 rounded-2xl shadow-xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            maxHeight: 'calc(100vh - 600px)',
            minHeight: '400px',
          }}
        >
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">{t('sendLogs')}</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                placeholder={t('searchLogsPlaceholder') || '搜索手机号或消息内容...'}
                className="flex-1 px-4 py-2 rounded-lg text-white placeholder-white/50"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  backgroundColor: '#c2905e',
                  color: '#fff',
                }}
              >
                {t('searchButton') || '搜索'}
              </button>
            </div>
          </div>
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="overflow-y-auto hide-scrollbar"
            style={{ maxHeight: 'calc(100vh - 700px)', minHeight: '300px' }}
          >
            {logsLoading && sendLogs.length === 0 ? (
              <p className="text-white/60 p-6">Loading...</p>
            ) : sendLogs.length === 0 ? (
              <p className="text-white/60 p-6">{t('noSendLogs')}</p>
            ) : (
              <>
                <ul className="p-4 space-y-3">
                  {sendLogs.map((log) => (
                    <li
                      key={log.id}
                      className="py-3 px-4 rounded-lg text-white/90"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-white">{log.phoneNumber}</div>
                          <div className="mt-1 text-white/70 text-sm line-clamp-2">{log.content}</div>
                          <div className="mt-1 text-white/50 text-xs">
                            {t('createdLabel')} {formatTime(log.createdAt)}
                          </div>
                        </div>
                        <span
                          className="shrink-0 px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: log.status === 'pending' ? 'rgba(255,193,7,0.2)' : log.status === 'sent' || log.status === 'delivered' ? 'rgba(76,175,80,0.2)' : log.status === 'failed' ? 'rgba(244,67,54,0.2)' : 'rgba(255,255,255,0.1)',
                            color: log.status === 'pending' ? '#ffc107' : log.status === 'sent' || log.status === 'delivered' ? '#4caf50' : log.status === 'failed' ? '#f44336' : '#fff',
                          }}
                        >
                          {statusKey[log.status] ?? log.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                {loadingMore && (
                  <div className="p-4 text-white/50 text-center">Loading...</div>
                )}
                {!hasMore && sendLogs.length > 0 && (
                  <div className="p-4 text-white/50 text-center text-sm">
                    {t('noMoreLogs') || '没有更多了'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

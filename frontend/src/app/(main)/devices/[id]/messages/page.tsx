'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { smsApi } from '@/lib/api';
import { LineSummary } from '@/lib/types';
import { formatDateTime } from '@/lib/dateUtils';

export default function MessagesPage() {
  const t = useTranslations('messages');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);

  const [lines, setLines] = useState<LineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    let pending = false;
    const load = async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const response = await smsApi.getMessageLines(deviceId);
        if (active) {
          setLines(response.data.data ?? []);
          setLoadFailed(false);
        }
      } catch {
        if (active) setLoadFailed(true);
      } finally {
        if (active) setLoading(false);
        pending = false;
      }
    };
    void load();
    const interval = setInterval(load, 10000);
    document.addEventListener('visibilitychange', load);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', load);
    };
  }, [deviceId, reload]);

  const noReceiverLabel = t('noReceiver');
  const lineDisplayLabel = (receiverPhone: string) =>
    receiverPhone === '__unknown__' || receiverPhone === 'none' ? noReceiverLabel : receiverPhone;
  const filteredLines = lines.filter(
    (line) =>
      lineDisplayLabel(line.receiverPhone).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (line.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">{tCommon('loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">{t('title')}</h1>
          <button
            onClick={() => router.push(`/devices/${deviceId}`)}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            {t('backToDevice')}
          </button>
        </div>

        {loadFailed && <p role="alert" className="mb-4 text-amber-200">
          {t('loadLinesFailed')} <button type="button" className="underline" onClick={() => setReload((value) => value + 1)}>{t('retryLoad')}</button>
        </p>}
        <div
          className="rounded-2xl shadow-xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            height: 'max(16rem, calc(100dvh - 250px))',
          }}
        >
          <div className="flex flex-col h-full">
            <div className="p-4">
              <input
                type="text"
                aria-label={t('searchConversations')}
                placeholder={t('searchConversations')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-white placeholder-white/50"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredLines.length === 0 ? (
                !loadFailed && <div className="p-4 text-white/50 text-center">{searchQuery.trim() ? t('noMatchingConversations') : t('noLines')}</div>
              ) : (
                filteredLines.map((line) => (
                  <Link
                    key={line.receiverPhone}
                    href={`/devices/${deviceId}/messages/${encodeURIComponent(line.receiverPhone)}`}
                    className="block p-4 transition-all duration-200 hover:bg-white/5"
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-white">
                        {lineDisplayLabel(line.receiverPhone)}
                      </span>
                      {line.unreadCount > 0 && (
                        <span
                          className="px-2 py-1 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: '#c2905e' }}
                        >
                          {line.unreadCount}
                        </span>
                      )}
                    </div>
                    {line.lastMessage != null && (
                      <div className="text-xs text-white/50 mb-0.5 flex items-center gap-1">
                        {line.lastMessageDirection === 'received' ? (
                          <>
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {t('incomingLabel')}
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="22" y1="2" x2="11" y2="13" />
                              <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                            {t('outgoingLabel')}
                          </>
                        )}
                      </div>
                    )}
                    <div className="text-sm text-white/70 truncate">
                      {line.lastMessage || t('noMessages')}
                    </div>
                    {line.lastMessageTime && (
                      <div className="text-xs text-white/50 mt-1">
                        {formatDateTime(line.lastMessageTime)}
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

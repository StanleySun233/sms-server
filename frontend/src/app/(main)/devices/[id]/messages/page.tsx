'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ElMessage } from 'element-plus';
import { smsApi } from '@/lib/api';
import { LineSummary } from '@/lib/types';
import { useLocale } from '@/contexts/LocaleContext';

export default function MessagesPage() {
  const t = useTranslations('messages');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);
  const { locale } = useLocale();
  const loc = locale === 'zh' ? 'zh-CN' : 'en-US';

  const [lines, setLines] = useState<LineSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await smsApi.getMessageLines(deviceId);
      setLines(response.data.data || []);
    };
    load().catch((error: unknown) => ElMessage.error((error as Error).message || t('loadLinesFailed'))).finally(() => setLoading(false));
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [deviceId]);

  const handleSelectLine = (receiverPhone: string) => {
    router.push(`/devices/${deviceId}/messages/${encodeURIComponent(receiverPhone)}`);
  };

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

        <div
          className="rounded-2xl shadow-xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            height: 'calc(100vh - 250px)',
          }}
        >
          <div className="flex flex-col h-full">
            <div className="p-4">
              <input
                type="text"
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
                <div className="p-4 text-white/50 text-center">{t('noLines')}</div>
              ) : (
                filteredLines.map((line) => (
                  <div
                    key={line.receiverPhone}
                    onClick={() => handleSelectLine(line.receiverPhone)}
                    className="p-4 cursor-pointer transition-all duration-200 hover:bg-white/5"
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
                    <div className="text-sm text-white/70 truncate">
                      {line.lastMessage || t('noMessages')}
                    </div>
                    {line.lastMessageTime && (
                      <div className="text-xs text-white/50 mt-1">
                        {new Date(line.lastMessageTime).toLocaleString(loc, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

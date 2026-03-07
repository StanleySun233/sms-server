'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ElMessage } from 'element-plus';
import { deviceApi } from '@/lib/api';
import { WebhookLogEntry, PagedWebhookLogsResponse } from '@/lib/types';
import { formatDateTime } from '@/lib/dateUtils';

const PAGE_SIZE = 20;

export default function DeviceLogPage() {
  const t = useTranslations('devices');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);

  const [records, setRecords] = useState<WebhookLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async (page: number = 1) => {
    setLoading(true);
    const res = await deviceApi.getWebhookLogs(deviceId, page, PAGE_SIZE);
    const body = res.data as { data?: PagedWebhookLogsResponse };
    const paged = body?.data;
    if (paged) {
      setRecords(paged.records ?? []);
      setTotal(paged.total);
      setCurrent(paged.current);
    } else {
      setRecords([]);
      setTotal(0);
    }
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    fetchLogs(1).catch((err: unknown) => {
      ElMessage.error((err as Error)?.message || t('loadFailed'));
      setLoading(false);
    });
  }, [fetchLogs, t]);

  const onPageChange = (page: number) => {
    fetchLogs(page).catch((err: unknown) => ElMessage.error((err as Error)?.message || t('loadFailed')));
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">{t('webhookLogsTitle')}</h1>
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
          }}
        >
          {loading ? (
            <div className="p-12 text-center text-white/70">{tCommon('loading')}</div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/70 text-lg">{t('noWebhookLogs')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                    >
                      <th className="text-left py-4 px-5 text-white/90 font-semibold">{t('webhookLogTime')}</th>
                      <th className="text-right py-4 px-5 text-white/90 font-semibold">{t('webhookLogNewMessages')}</th>
                      <th className="text-right py-4 px-5 text-white/90 font-semibold">{t('webhookLogMissedCalls')}</th>
                      <th className="text-right py-4 px-5 text-white/90 font-semibold">{t('webhookLogCommands')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((row, i) => (
                      <tr
                        key={row.id}
                        className="transition-colors duration-150"
                        style={{
                          backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                          borderBottom: i < records.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                        }}
                      >
                        <td className="py-3 px-5 text-white/90">{formatDateTime(row.receivedAt)}</td>
                        <td className="py-3 px-5 text-right text-white/80">{row.newMessagesCount}</td>
                        <td className="py-3 px-5 text-right text-white/80">{row.missedCallsCount}</td>
                        <td className="py-3 px-5 text-right text-white/80">{row.commandsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between py-4 px-5"
                  style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}
                >
                  <span className="text-white/60 text-sm">
                    Total: {total}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onPageChange(current - 1)}
                      disabled={current <= 1}
                      className="px-3 py-1.5 rounded-lg text-sm text-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1.5 text-white/80 text-sm">
                      {current} / {totalPages}
                    </span>
                    <button
                      onClick={() => onPageChange(current + 1)}
                      disabled={current >= totalPages}
                      className="px-3 py-1.5 rounded-lg text-sm text-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

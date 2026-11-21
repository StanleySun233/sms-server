'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ElMessage } from 'element-plus';
import { deviceApi, identifySmsDraft, smsApi, type SmsDraft } from '@/lib/api';
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
  const [sendReady, setSendReady] = useState<boolean>();
  const draft = useRef<SmsDraft | null>(null);

  const fetchSendLogs = useCallback(() => {
    smsApi.getSendLogs(deviceId, 20)
      .then((res) => {
        const data = (res.data as { data?: SendLogItem[] })?.data;
        setSendLogs(Array.isArray(data) ? data : []);
      })
      .catch(() => { /* Keep the last successful results when a refresh fails. */ })
      .finally(() => setLogsLoading(false));
  }, [deviceId]);

  useEffect(() => {
    const refresh = () => {
      fetchSendLogs();
      deviceApi.get(deviceId).then(({ data }) => setSendReady(data.smsSendReady)).catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [deviceId, fetchSendLogs]);

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = sendPhone.trim();
    const content = sendContent.trim();
    if (!phone || !content || sending || sendReady !== true) return;
    setSending(true);
    const identified = identifySmsDraft(draft.current, deviceId, phone, content);
    draft.current = identified;
    smsApi.sendMessage(deviceId, identified)
      .then(() => {
        draft.current = null;
        setSendPhone('');
        setSendContent('');
        ElMessage.success(t('sendQueuedSuccess'));
        fetchSendLogs();
      })
      .catch((err: Error) => ElMessage.error(err.message || t('loadFailed')))
      .finally(() => setSending(false));
  };

  const statusKey: Record<string, string> = {
    pending: t('statusPending'),
    sent: t('statusSent'),
    delivered: t('statusDelivered'),
    failed: t('statusFailed'),
    dispatching: t('statusDispatching'),
    submitted: t('statusSubmitted'),
    unknown: t('statusUnknown'),
    expired: t('statusExpired'),
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
            {sendReady === false && <p role="status" className="text-amber-200">{t('smsSendNotReady')}</p>}
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
              disabled={sending || sendReady !== true || !sendPhone.trim() || !sendContent.trim()}
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
          className="mt-8 rounded-2xl p-8 shadow-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <h2 className="text-xl font-semibold text-white mb-4">{t('sendLogs')}</h2>
          {logsLoading ? (
            <p className="text-white/60">Loading...</p>
          ) : sendLogs.length === 0 ? (
            <p className="text-white/60">{t('noSendLogs')}</p>
          ) : (
            <ul className="space-y-3">
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
          )}
        </div>
      </div>
    </div>
  );
}

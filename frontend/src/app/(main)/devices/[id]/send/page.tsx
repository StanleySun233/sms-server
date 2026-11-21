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
  attemptCount?: number;
  attemptOfferCount?: number;
  attemptExpiresAt?: string | null;
};

export default function DeviceSendPage() {
  const params = useParams<{ id: string }>();
  return <DeviceSendScreen key={params.id} deviceId={Number(params.id)} />;
}

function DeviceSendScreen({ deviceId }: { deviceId: number }) {
  const t = useTranslations('devices');
  const tMessages = useTranslations('messages');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [sendPhone, setSendPhone] = useState('');
  const [sendContent, setSendContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendLogs, setSendLogs] = useState<SendLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState(false);
  const [sendReady, setSendReady] = useState<boolean>();
  const [readinessError, setReadinessError] = useState(false);
  const draft = useRef<SmsDraft | null>(null);
  const logsRequest = useRef(0);
  const validPhone = /^\+?[0-9]{5,19}$/.test(sendPhone.trim());

  const fetchSendLogs = useCallback(() => {
    const request = ++logsRequest.current;
    return smsApi.getSendLogs(deviceId, 20)
      .then((res) => {
        if (request !== logsRequest.current) return;
        const data = (res.data as { data?: SendLogItem[] })?.data;
        setSendLogs(Array.isArray(data) ? data : []);
        setLogsError(false);
      })
      .catch(() => {
        if (request === logsRequest.current) setLogsError(true);
      })
      .finally(() => {
        if (request === logsRequest.current) setLogsLoading(false);
      });
  }, [deviceId]);

  useEffect(() => {
    let active = true;
    let pending = false;
    const refresh = async () => {
      if (document.hidden || pending) return;
      pending = true;
      try {
        await Promise.all([
          fetchSendLogs(),
          deviceApi.get(deviceId).then(({ data }) => {
            if (active) { setSendReady(data.smsSendReady === true); setReadinessError(false); }
          }).catch(() => {
            if (active) setReadinessError(true);
          }),
        ]);
      } finally {
        pending = false;
      }
    };
    refresh();
    const interval = setInterval(refresh, 10000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [deviceId, fetchSendLogs]);

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = sendPhone.trim();
    const content = sendContent.trim();
    if (!validPhone || !content || sending || sendReady !== true) return;
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
            {readinessError ? <p role="status" className="text-amber-200">{t('firstHeartbeatCheckFailed')}</p> :
              sendReady === false && <p role="status" className="text-amber-200">{t('smsSendNotReady')}</p>}
            <div>
              <label htmlFor="sms-phone" className="block text-white/70 mb-2">{t('phone')}</label>
              <input
                id="sms-phone"
                type="tel"
                maxLength={20}
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
              <label htmlFor="sms-content" className="block text-white/70 mb-2">{t('contentLabel')}</label>
              <textarea
                id="sms-content"
                maxLength={1000}
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
              disabled={sending || sendReady !== true || !validPhone || !sendContent.trim()}
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
          {logsError && <p role="alert" className="mb-3 text-amber-200">
            {t('loadSendLogsFailed')} <button type="button" onClick={fetchSendLogs} className="underline">{tCommon('tryAgain')}</button>
          </p>}
          {logsLoading ? (
            <p className="text-white/60">{tCommon('loading')}</p>
          ) : sendLogs.length === 0 ? (
            !logsError && <p className="text-white/60">{t('noSendLogs')}</p>
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
                  <div className="flex flex-wrap justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white">{log.phoneNumber}</div>
                      <div className="mt-1 text-white/70 text-sm line-clamp-2">{log.content}</div>
                      <div className="mt-1 text-white/50 text-xs">
                        {t('createdLabel')} {formatTime(log.createdAt)}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${
                        ['pending', 'dispatching', 'unknown', 'sent'].includes(log.status)
                          ? 'bg-amber-400/20 text-amber-200'
                          : ['submitted', 'delivered'].includes(log.status)
                            ? 'bg-emerald-400/20 text-emerald-200'
                            : 'bg-white/10 text-rose-200'
                      }`}
                    >
                      {statusKey[log.status] ?? log.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/70">
                    <span>{t('smsTaskId', { id: log.id })}</span>
                    {log.status === 'submitted' && log.sentAt && <span>{t('smsDeviceConfirmedAt', { time: formatTime(log.sentAt) })}</span>}
                    {(log.status === 'pending' || log.status === 'dispatching') && log.attemptExpiresAt &&
                      <span>{t('smsDeadline', { time: formatTime(log.attemptExpiresAt) })}</span>}
                    {(log.status === 'failed' || log.status === 'expired') && log.attemptCount != null &&
                      <span>{t('smsAttemptCount', { count: log.attemptCount })}</span>}
                    {log.status === 'dispatching' && log.attemptOfferCount != null &&
                      <span>{t('smsOfferCount', { count: log.attemptOfferCount })}</span>}
                  </div>
                  {(log.status === 'unknown' || log.status === 'sent') && <p className="mt-2 text-xs text-amber-200">{t('smsUnconfirmedHint')}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

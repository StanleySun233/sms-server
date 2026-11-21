'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ElMessage } from 'element-plus';
import { missedCallApi } from '@/lib/api';
import { MissedCallResponse } from '@/lib/types';
import MissedCallCard from '@/components/MissedCallCard';
import { decodeRouteSegment } from '@/lib/utils';

export default function CallHistoryPage() {
  const params = useParams<{ id: string; phone: string }>();
  const phone = decodeRouteSegment(params.phone);
  return <CallHistoryScreen key={JSON.stringify([params.id, phone])}
    deviceId={Number(params.id)} phone={phone} />;
}

function CallHistoryScreen({ deviceId, phone }: { deviceId: number; phone: string }) {
  const t = useTranslations('calls');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [calls, setCalls] = useState<MissedCallResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    let active = true;
    void missedCallApi.getCallHistory(deviceId, phone).then(({ data }) => {
      if (!active) return;
      setCalls(data.data ?? []);
      setLoadError(false);
    }).catch(() => {
      if (active) setLoadError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [deviceId, phone, reload]);

  const markRead = async (ids: number[]) => {
    if (marking || !ids.length) return;
    setMarking(true);
    try {
      await missedCallApi.markAsRead(ids);
      const readAt = new Date().toISOString();
      const readIds = new Set(ids);
      setCalls((previous) => previous.map((call) => readIds.has(call.id) ? { ...call, readAt } : call));
      ElMessage.success(ids.length === 1 ? t('markedRead') : t('markedCountRead', { count: ids.length }));
    } catch {
      ElMessage.error(t('markReadFailed'));
    } finally {
      setMarking(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadCallIds = calls.filter((call) => !call.readAt).map((call) => call.id);
    if (unreadCallIds.length === 0) {
      ElMessage.info(t('allMarkedRead'));
      return;
    }
    await markRead(unreadCallIds);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">{tCommon('loading')}</div>
      </div>
    );
  }

  const unreadCount = calls.filter((call) => !call.readAt).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{t('callHistory')}</h1>
            <p className="text-white/70 text-lg">{phone}</p>
          </div>
          <button
            onClick={() => router.push(`/devices/${deviceId}/calls`)}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            {t('backToMissedCalls')}
          </button>
        </div>

        {unreadCount > 0 && (
          <div className="mb-4">
            <button
              onClick={handleMarkAllAsRead}
              disabled={marking}
              className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.3)',
                color: '#fff',
              }}
            >
              {t('markAllRead', { count: unreadCount })}
            </button>
          </div>
        )}

        {loadError ? (
          <p role="alert" className="rounded-lg border border-white/20 p-4 text-amber-100">
            {t('loadHistoryFailed')} <button type="button" className="underline" onClick={() => setReload((value) => value + 1)}>{tCommon('tryAgain')}</button>
          </p>
        ) : calls.length === 0 ? (
          <div
            className="rounded-2xl p-8 shadow-xl text-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <p className="text-white/70 text-lg">{t('noCallHistory')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => (
              <MissedCallCard key={call.id} call={call} marking={marking} onMarkAsRead={(id) => markRead([id])} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

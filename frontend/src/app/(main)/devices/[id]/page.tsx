'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ElMessage } from 'element-plus';
import { deviceApi } from '@/lib/api';
import { Device } from '@/lib/types';
import { parseUtcAndFormatLocal, getDeviceStatusFromHeartbeat } from '@/lib/dateUtils';
import StatusIndicator from '@/components/StatusIndicator';
import CopyButton from '@/components/CopyButton';

export default function DeviceDetailPage() {
  const t = useTranslations('devices');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevice = async () => {
      const response = await deviceApi.get(deviceId);
      setDevice(response.data);
    };
    fetchDevice().catch((error: any) => {
      ElMessage.error(error.message || t('loadFailed'));
      router.push('/devices');
    }).finally(() => setLoading(false));

    const interval = setInterval(() => deviceApi.get(deviceId).then((r) => setDevice(r.data)), 30000);
    return () => clearInterval(interval);
  }, [deviceId, router]);

  const handleDelete = async () => {
    if (!confirm(t('confirmDeleteIrreversible'))) {
      return;
    }
    await deviceApi.delete(deviceId);
    ElMessage.success(t('deleteSuccess'));
    router.push('/devices');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">{tCommon('loading')}</div>
      </div>
    );
  }

  if (!device) return null;

  const webhookUrl =
    (typeof window !== 'undefined' ? window.location.origin : '') +
    '/api/webhook/' +
    device.webhookToken;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">{device.alias}</h1>
          <button
            onClick={() => router.push('/devices')}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            {t('backToList')}
          </button>
        </div>

        <div
          className="rounded-2xl p-8 shadow-xl mb-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <h2 className="text-2xl font-semibold text-white mb-6">{t('deviceInfo')}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-white/70 mb-2">{t('status')}</label>
              <StatusIndicator status={getDeviceStatusFromHeartbeat(device.lastHeartbeatAt)} />
            </div>

            <div>
              <label className="block text-white/70 mb-2">{t('webhookToken')}</label>
              <div className="bg-black/30 p-4 rounded-lg mb-2">
                <code className="text-green-400 break-all">{device.webhookToken}</code>
              </div>
              <CopyButton text={device.webhookToken} label={tCommon('copyToken')} />
            </div>

            <div>
              <label className="block text-white/70 mb-2">{t('webhookUrl')}</label>
              <div className="bg-black/30 p-4 rounded-lg mb-2">
                <code className="text-green-400 break-all">{webhookUrl}</code>
              </div>
              <CopyButton text={webhookUrl} label={tCommon('copyUrl')} />
            </div>

            {device.currentPhoneNumber && (
              <div>
                <label className="block text-white/70 mb-2">{t('currentNumber')}</label>
                <div className="text-white text-lg">{device.currentPhoneNumber}</div>
              </div>
            )}

            {device.lastHeartbeatAt && (
              <div>
                <label className="block text-white/70 mb-2">{t('lastHeartbeat')}</label>
                <div className="text-white text-lg">
                  {parseUtcAndFormatLocal(device.lastHeartbeatAt)}
                </div>
              </div>
            )}

            <div>
              <label className="block text-white/70 mb-2">{t('createdAt')}</label>
              <div className="text-white text-lg">
                {new Date(device.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => router.push(`/devices/${device.id}/edit`)}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: '#c2905e',
                color: '#fff',
              }}
            >
              {t('editDevice')}
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                color: '#fff',
              }}
            >
              {t('deleteDevice')}
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl p-8 shadow-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4">{t('quickActions')}</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push(`/devices/${device.id}/messages`)}
              className="rounded-lg p-6 text-left transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'rgba(96, 165, 250, 0.12)',
                border: '1px solid rgba(96, 165, 250, 0.22)',
              }}
            >
              <div className="text-white text-lg font-medium mb-2">{t('receiveSms')}</div>
              <p className="text-white/70 text-sm">{t('receiveSmsHint')}</p>
            </button>

            <button
              onClick={() => router.push(`/devices/${device.id}/send`)}
              className="rounded-lg p-6 text-left transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'rgba(194, 144, 94, 0.12)',
                border: '1px solid rgba(194, 144, 94, 0.28)',
              }}
            >
              <div className="text-white text-lg font-medium mb-2">{t('sendSms')}</div>
              <p className="text-white/70 text-sm">{t('sendSmsHint')}</p>
            </button>

            <button
              onClick={() => router.push(`/devices/${device.id}/calls`)}
              className="rounded-lg p-6 text-left transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 text-white text-lg font-medium mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="#ef4444"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
                {t('missedCalls')}
              </div>
              <p className="text-white/70 text-sm">{t('missedCallsHint')}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

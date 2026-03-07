'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ElMessage } from 'element-plus';
import { deviceApi } from '@/lib/api';
import { Device } from '@/lib/types';
import { parseUtcAndFormatLocal, getDeviceStatusFromHeartbeat, formatDateTime } from '@/lib/dateUtils';
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
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferUsername, setTransferUsername] = useState('');
  const [transferConfirmTarget, setTransferConfirmTarget] = useState<string | null>(null);
  const [transferChecking, setTransferChecking] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);

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

  const openTransferDialog = () => {
    setTransferUsername('');
    setTransferConfirmTarget(null);
    setTransferOpen(true);
  };

  const handleCheckUsername = async () => {
    const username = transferUsername.trim();
    if (!username) {
      ElMessage.warning(t('enterUsername'));
      return;
    }
    setTransferChecking(true);
    setTransferConfirmTarget(null);
    const res = await deviceApi.checkTransferUsername(username).then((r) => r.data).catch((err: any) => {
      const msg = err.message && err.message.includes('transfer to self') ? t('cannotTransferToSelf') : (err.message || t('userNotFound'));
      ElMessage.error(msg);
      return null;
    }).finally(() => setTransferChecking(false));
    if (res && res.exists && res.username) setTransferConfirmTarget(res.username);
  };

  const handleTransferConfirm = async () => {
    const username = transferConfirmTarget || transferUsername.trim();
    if (!username) return;
    setTransferSubmitting(true);
    await deviceApi.transfer(deviceId, username).then(() => {
      ElMessage.success(t('transferSuccess'));
      setTransferOpen(false);
      router.push('/devices');
    }).catch((err: any) => {
      ElMessage.error(err.message || t('userNotFound'));
    }).finally(() => setTransferSubmitting(false));
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

            <div>
              <label className="block text-white/70 mb-2">{t('currentNumber')}</label>
              <div className="text-white text-lg">{device.currentPhoneNumber || t('neverOnline')}</div>
            </div>

            {(device.imei != null && device.imei !== '') && (
              <div>
                <label className="block text-white/70 mb-2">{t('imei')}</label>
                <div className="text-white text-lg">{device.imei}</div>
              </div>
            )}

            {device.signalStrength != null && (
              <div>
                <label className="block text-white/70 mb-2">{t('signalStrength')}</label>
                <div className="text-white text-lg">{device.signalStrength} dBm</div>
              </div>
            )}

            {(device.latitude != null && device.longitude != null) && (
              <div>
                <label className="block text-white/70 mb-2">{t('location')}</label>
                <div className="text-white text-lg">
                  {device.latitude.toFixed(6)}, {device.longitude.toFixed(6)}
                  <a
                    href={`https://apis.map.qq.com/uri/v1/marker?coord_type=1&marker=title:;coord:${device.latitude},${device.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 text-amber-400 hover:underline"
                  >
                    {t('viewOnMap')}
                  </a>
                </div>
              </div>
            )}

            <div>
              <label className="block text-white/70 mb-2">{t('lastHeartbeat')}</label>
              <div className="text-white text-lg">
                {device.lastHeartbeatAt ? parseUtcAndFormatLocal(device.lastHeartbeatAt) : t('neverOnline')}
              </div>
            </div>

            <div>
              <label className="block text-white/70 mb-2">{t('createdAt')}</label>
              <div className="text-white text-lg">
                {formatDateTime(device.createdAt)}
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
              onClick={openTransferDialog}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: 'rgba(96, 165, 250, 0.5)',
                color: '#fff',
              }}
            >
              {t('transferDevice')}
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

        {transferOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => !transferSubmitting && !transferChecking && setTransferOpen(false)}
          >
            <div
              className="rounded-2xl p-6 w-full max-w-md shadow-xl"
              style={{
                backgroundColor: 'rgba(30,30,40,0.98)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-white mb-4">{t('transferDevice')}</h3>
              {transferConfirmTarget == null ? (
                <>
                  <input
                    type="text"
                    value={transferUsername}
                    onChange={(e) => setTransferUsername(e.target.value)}
                    placeholder={t('enterUsername')}
                    className="w-full px-4 py-3 rounded-lg mb-4 text-white placeholder-white/50"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                  />
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setTransferOpen(false)}
                      className="px-4 py-2 rounded-lg text-white/80"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      {tCommon('cancel')}
                    </button>
                    <button
                      onClick={handleCheckUsername}
                      disabled={transferChecking}
                      className="px-4 py-2 rounded-lg font-medium text-white"
                      style={{ backgroundColor: '#60a5fa' }}
                    >
                      {transferChecking ? '...' : t('checkUsername')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-white/90 mb-2">{t('confirmTransfer', { username: transferConfirmTarget })}</p>
                  <p className="text-white/60 text-sm mb-6">{t('transferHint')}</p>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setTransferConfirmTarget(null)}
                      disabled={transferSubmitting}
                      className="px-4 py-2 rounded-lg text-white/80"
                      style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                    >
                      {tCommon('cancel')}
                    </button>
                    <button
                      onClick={handleTransferConfirm}
                      disabled={transferSubmitting}
                      className="px-4 py-2 rounded-lg font-medium text-white"
                      style={{ backgroundColor: '#60a5fa' }}
                    >
                      {transferSubmitting ? '...' : t('transferTo')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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
              className="rounded-lg p-6 text-left transition-all duration-200 hover:scale-105 flex flex-col items-start"
              style={{
                backgroundColor: 'rgba(96, 165, 250, 0.12)',
                border: '1px solid rgba(96, 165, 250, 0.22)',
              }}
            >
              <div className="flex items-center gap-2 text-white text-lg font-medium mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="#60a5fa"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
                {t('receiveSms')}
              </div>
              <p className="text-white/70 text-sm text-left">{t('receiveSmsHint')}</p>
            </button>

            <button
              onClick={() => router.push(`/devices/${device.id}/send`)}
              className="rounded-lg p-6 text-left transition-all duration-200 hover:scale-105 flex flex-col items-start"
              style={{
                backgroundColor: 'rgba(194, 144, 94, 0.12)',
                border: '1px solid rgba(194, 144, 94, 0.28)',
              }}
            >
              <div className="flex items-center gap-2 text-white text-lg font-medium mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="#c2905e"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                  />
                </svg>
                {t('sendSms')}
              </div>
              <p className="text-white/70 text-sm text-left">{t('sendSmsHint')}</p>
            </button>

            <button
              onClick={() => router.push(`/devices/${device.id}/calls`)}
              className="rounded-lg p-6 text-left transition-all duration-200 hover:scale-105 flex flex-col items-start"
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
              <p className="text-white/70 text-sm text-left">{t('missedCallsHint')}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

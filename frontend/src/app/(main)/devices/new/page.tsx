'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { deviceApi } from '@/lib/api';
import CopyButton from '@/components/CopyButton';

export default function NewDevicePage() {
  const t = useTranslations('devices');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdDevice, setCreatedDevice] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!alias.trim()) {
      setError(t('nameRequired'));
      return;
    }
    setLoading(true);
    deviceApi.create({ alias }).then((response) => {
      setCreatedDevice(response.data);
      setSuccess(t('createSuccess'));
    }).catch((err: any) => setError(err.message || t('createFailed'))).finally(() => setLoading(false));
  };

  const webhookUrl = createdDevice
    ? (typeof window !== 'undefined' ? window.location.origin : '') +
      '/api/webhook/' +
      createdDevice.webhookToken
    : '';

  if (createdDevice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div
          className="max-w-2xl mx-auto rounded-2xl p-8 shadow-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <h1 className="text-3xl font-bold text-white mb-6">{t('createSuccess')}</h1>

          <div className="space-y-6">
            <div>
              <label className="block text-white/70 mb-2">{t('deviceName')}</label>
              <div className="text-white text-lg font-medium">{createdDevice.alias}</div>
            </div>

            <div>
              <label className="block text-white/70 mb-2">{t('webhookToken')}</label>
              <div className="bg-black/30 p-4 rounded-lg mb-2">
                <code className="text-green-400 break-all">{createdDevice.webhookToken}</code>
              </div>
              <CopyButton text={createdDevice.webhookToken} label={tCommon('copyToken')} />
            </div>

            <div>
              <label className="block text-white/70 mb-2">{t('webhookUrl')}</label>
              <div className="bg-black/30 p-4 rounded-lg mb-2">
                <code className="text-green-400 break-all">{webhookUrl}</code>
              </div>
              <CopyButton text={webhookUrl} label={tCommon('copyUrl')} />
            </div>

            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                {t('webhookImportant')}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => router.push('/devices')}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                style={{
                  backgroundColor: '#c2905e',
                  color: '#fff',
                }}
              >
                {t('backToList')}
              </button>
              <button
                onClick={() => router.push(`/devices/${createdDevice.id}`)}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200"
                style={{
                  backgroundColor: 'rgba(194, 144, 94, 0.3)',
                  color: '#fff',
                }}
              >
                {t('viewDevice')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div
        className="max-w-2xl mx-auto rounded-2xl p-8 shadow-xl"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <h1 className="text-3xl font-bold text-white mb-6">{t('newDeviceTitle')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
              <p className="text-green-200">{success}</p>
            </div>
          )}

          <div>
            <label className="block text-white/90 mb-2">{t('deviceName')}</label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder={t('placeholderDeviceName')}
              maxLength={100}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-[#c2905e] transition-colors"
            />
            <p className="text-white/60 text-sm mt-2">
              {t('deviceNameHint')}
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: '#c2905e',
                color: '#fff',
              }}
            >
              {loading ? t('creating') : t('createDevice')}
            </button>
            <button
              type="button"
              onClick={() => router.push('/devices')}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
              }}
            >
              {tCommon('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { deviceApi } from '@/lib/api';
import { Device } from '@/lib/types';

export default function EditDevicePage() {
  const params = useParams<{ id: string }>();
  return <EditDeviceScreen key={params.id} deviceId={Number(params.id)} />;
}

function EditDeviceScreen({ deviceId }: { deviceId: number }) {
  const t = useTranslations('devices');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [device, setDevice] = useState<Device | null>(null);
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void deviceApi.get(deviceId).then((response) => {
      if (!active) return;
      setDevice(response.data);
      setAlias(response.data.alias);
    }).catch(() => {
      if (active) setDevice(null);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [deviceId, reload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = alias.trim();
    if (!device || saving || name === device.alias) return;
    setError('');
    setSuccess('');
    if (!name) {
      setError(t('nameRequired'));
      return;
    }
    setSaving(true);
    deviceApi.update(deviceId, { alias: name }).then(({ data }) => {
      setDevice(data);
      setAlias(data.alias);
      setSuccess(t('updateSuccess'));
    }).catch(() => setError(t('updateFailed'))).finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">{tCommon('loading')}</div>
      </div>
    );
  }

  if (!device) {
    return <p role="alert" className="mx-auto mt-8 max-w-2xl p-4 text-amber-200">
      {t('loadFailed')} <button type="button" className="underline" onClick={() => setReload((value) => value + 1)}>{tCommon('tryAgain')}</button>
    </p>;
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
        <h1 className="text-3xl font-bold text-white mb-6">{t('editDeviceTitle')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p role="alert" className="text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
              <p role="status" className="text-green-200">{success}</p>
            </div>
          )}

          <div>
            <label htmlFor="edit-device-alias" className="block text-white/90 mb-2">{t('deviceName')}</label>
            <input
              id="edit-device-alias"
              type="text"
              required
              disabled={saving}
              value={alias}
              onChange={(e) => { setAlias(e.target.value); setError(''); setSuccess(''); }}
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
              disabled={saving || !alias.trim() || alias.trim() === device.alias}
              className="flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: '#c2905e',
                color: '#fff',
              }}
            >
              {saving ? tCommon('saving') : tCommon('saveChanges')}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/devices/${deviceId}`)}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
              }}
            >
              {t('backToDevice')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { deviceApi } from '@/lib/api';
import { Device } from '@/lib/types';
import DeviceCard from '@/components/DeviceCard';

export default function DevicesPage() {
  const t = useTranslations('devices');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    void deviceApi.list().then(({ data }) => {
      if (!active) return;
      setDevices(data);
      setLoadError(false);
    }).catch(() => {
      if (active) setLoadError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reload]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">{tCommon('loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">{t('listTitle')}</h1>
        <button
          onClick={() => router.push('/devices/new')}
          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: '#c2905e',
            color: '#fff',
          }}
        >
          {t('addDevice')}
        </button>
      </div>

      {loadError ? (
        <p role="alert" className="rounded-lg border border-white/20 p-4 text-amber-100">
          {t('loadFailed')} <button type="button" className="underline" onClick={() => setReload((value) => value + 1)}>{tCommon('tryAgain')}</button>
        </p>
      ) : devices.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4">{t('noDevices')}</h2>
          <p className="text-white/70 mb-6">{t('addFirstHint')}</p>
          <button
            onClick={() => router.push('/devices/new')}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
            style={{
              backgroundColor: '#c2905e',
              color: '#fff',
            }}
          >
            {t('addDevice')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}

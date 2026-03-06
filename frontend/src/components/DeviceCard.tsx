'use client';

import { useTranslations } from 'next-intl';
import { Device } from '@/lib/types';
import { parseUtcAndFormatLocal } from '@/lib/dateUtils';
import StatusIndicator from './StatusIndicator';
import { useRouter } from 'next/navigation';

interface DeviceCardProps {
  device: Device;
}

export default function DeviceCard({ device }: DeviceCardProps) {
  const t = useTranslations('devices');
  const router = useRouter();

  return (
    <div
      className="rounded-2xl p-6 shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
      onClick={() => router.push(`/devices/${device.id}`)}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{device.alias}</h3>
          <StatusIndicator status={device.status} />
        </div>
      </div>

      <div className="space-y-2 text-white/70 text-sm">
        {device.currentPhoneNumber && (
          <div>
            <span className="font-medium">{t('phone')}：</span> {device.currentPhoneNumber}
          </div>
        )}
        {device.lastHeartbeatAt && (
          <div>
            <span className="font-medium">{t('lastHeartbeatLabel')}</span>{' '}
            {parseUtcAndFormatLocal(device.lastHeartbeatAt)}
          </div>
        )}
        <div>
          <span className="font-medium">{t('createdLabel')}</span>{' '}
          {new Date(device.createdAt).toLocaleDateString()}
        </div>
      </div>

    </div>
  );
}

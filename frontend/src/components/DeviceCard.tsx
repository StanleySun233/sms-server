'use client';

import { useTranslations } from 'next-intl';
import { Device } from '@/lib/types';
import { parseUtcAndFormatLocal, getDeviceStatusFromHeartbeat, formatDateTime } from '@/lib/dateUtils';
import StatusIndicator from './StatusIndicator';
import Link from 'next/link';

interface DeviceCardProps {
  device: Device;
}

export default function DeviceCard({ device }: DeviceCardProps) {
  const t = useTranslations('devices');

  return (
    <Link
      href={`/devices/${device.id}`}
      className="block min-w-0 rounded-2xl p-4 sm:p-6 shadow-xl transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0">
          <h3 className="break-words text-xl font-semibold text-white mb-2">{device.alias}</h3>
          <StatusIndicator status={getDeviceStatusFromHeartbeat(device.lastHeartbeatAt)} />
        </div>
      </div>

      <div className="space-y-2 text-white/70 text-sm">
        <div>
          <span className="font-medium">{t('phone')}：</span> {device.currentPhoneNumber || t('neverOnline')}
        </div>
        <div>
          <span className="font-medium">{t('imei')}：</span> {device.imei != null && device.imei !== '' ? device.imei : t('neverOnline')}
        </div>
        <div>
          <span className="font-medium">{t('signalStrength')}：</span> {device.signalStrength != null ? `${device.signalStrength} dBm` : t('neverOnline')}
        </div>
        <div>
          <span className="font-medium">{t('heartbeatLabel')}</span>{' '}
          {device.lastHeartbeatAt ? parseUtcAndFormatLocal(device.lastHeartbeatAt) : t('neverOnline')}
        </div>
        <div>
          <span className="font-medium">{t('createdLabel')}</span>{' '}
          {formatDateTime(device.createdAt)}
        </div>
      </div>

    </Link>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { DeviceStats } from '@/lib/types';
import { parseUtcAndFormatLocal, getDeviceStatusFromHeartbeat } from '@/lib/dateUtils';
import { useRouter } from 'next/navigation';
import StatusIndicator from './StatusIndicator';

interface DeviceGridProps {
  devices: DeviceStats[];
}

export default function DeviceGrid({ devices }: DeviceGridProps) {
  const t = useTranslations('devices');
  const router = useRouter();

  if (devices.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <p className="text-white/70 text-lg">{t('addFirstHint')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-6 gap-6">
      {devices.map((device) => (
        <div
          key={device.id}
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
              <StatusIndicator status={getDeviceStatusFromHeartbeat(device.lastHeartbeatAt)} />
            </div>
          </div>

          <div className="space-y-3 text-white/70 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">📱 {t('phone')}：</span>
              <span>{device.currentPhoneNumber || t('neverOnline')}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-medium">💓 {t('heartbeatLabel')}</span>
              <span>{device.lastHeartbeatAt ? parseUtcAndFormatLocal(device.lastHeartbeatAt) : t('neverOnline')}</span>
            </div>

            <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
              {device.unreadMessages > 0 && (
                <div
                  className="flex items-center gap-2 px-3 py-1 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(194, 144, 94, 0.3)',
                  }}
                >
                  <span>💬</span>
                  <span className="font-semibold">{device.unreadMessages}</span>
                  <span className="text-xs">{t('unread')}</span>
                </div>
              )}

              {device.unreadCalls > 0 && (
                <div
                  className="flex items-center gap-2 px-3 py-1 rounded-lg"
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <span>📞</span>
                  <span className="font-semibold">{device.unreadCalls}</span>
                  <span className="text-xs">{t('missed')}</span>
                </div>
              )}

              {device.unreadMessages === 0 && device.unreadCalls === 0 && (
                <div className="text-white/50 text-sm">
                  {t('allCaughtUp')}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import StatCard from '@/components/StatCard';
import DeviceGrid from '@/components/DeviceGrid';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { authApi, dashboardApi } from '@/lib/api';
import { DashboardStatsResponse } from '@/lib/types';
import { getDeviceStatusFromHeartbeat, formatDateTime } from '@/lib/dateUtils';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async () => {
    const response = await dashboardApi.getStats();
    setStats(response.data);
    setLastUpdated(new Date());
  };

  const fetchUser = async () => {
    const response = await authApi.getCurrentUser();
    setUser(response.data);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUser(), fetchStats()]);
      setLoading(false);
    };
    loadData();
    const interval = setInterval(() => fetchStats(), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchStats();
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#c2905e' }}>
            {t('title')}
          </h1>
          {user && (
            <p className="text-white/70">{t('welcomeBack', { username: user.username })}</p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-lg transition-all duration-200 text-white"
          style={{
            backgroundColor: 'rgba(194, 144, 94, 0.3)',
            border: '1px solid rgba(194, 144, 94, 0.5)',
          }}
        >
          🔄 {t('refresh')}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-white text-xl">{t('loading')}</div>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-6 gap-6 mb-8">
            <StatCard
              title={t('onlineDevices')}
              value={stats.devices.filter((d) => getDeviceStatusFromHeartbeat(d.lastHeartbeatAt) === 'online').length}
              icon="✓"
              color="#10b981"
            />
            <StatCard
              title={t('warningDevices')}
              value={stats.devices.filter((d) => getDeviceStatusFromHeartbeat(d.lastHeartbeatAt) === 'warning').length}
              icon="⚠"
              color="#f59e0b"
            />
            <StatCard
              title={t('offlineDevices')}
              value={stats.devices.filter((d) => getDeviceStatusFromHeartbeat(d.lastHeartbeatAt) === 'offline').length}
              icon="✗"
              color="#ef4444"
            />
            <StatCard
              title={t('unreadMessages')}
              value={stats.totalUnreadMessages}
              icon="💬"
              color="#c2905e"
            />
            <StatCard
              title={t('missedCalls')}
              value={stats.totalUnreadCalls}
              icon="📞"
              color="#ef4444"
            />
            <StatCard
              title={t('sentMessages')}
              value={stats.totalSentMessages ?? 0}
              icon="📤"
              color="#3b82f6"
            />
          </div>

          <div className="mb-6 text-white/50 text-sm flex justify-between items-center">
            <span>{t('lastUpdated')}{formatDateTime(lastUpdated)}</span>
            <span className="text-white/30">{t('autoRefresh')}</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">
              {t('myDevices', { count: stats.devices.length })}
            </h2>
            <DeviceGrid devices={stats.devices} />
          </div>
        </>
      ) : (
        <div className="text-white text-center">{t('loadFailed')}</div>
      )}
    </div>
  );
}

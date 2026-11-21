'use client';

import StatCard from '@/components/StatCard';
import DeviceGrid from '@/components/DeviceGrid';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { dashboardApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardStatsResponse } from '@/lib/types';
import { formatDateTime } from '@/lib/dateUtils';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>();
  const [refreshError, setRefreshError] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let active = true;
    let pending = false;
    const fetchStats = async () => {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const { data } = await dashboardApi.getStats();
        if (active) {
          setStats(data);
          setLastUpdated(new Date());
          setRefreshError(false);
        }
      } catch {
        if (active) setRefreshError(true);
      } finally {
        pending = false;
        if (active) setLoading(false);
      }
    };
    void fetchStats();
    const interval = setInterval(fetchStats, 30000);
    document.addEventListener('visibilitychange', fetchStats);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', fetchStats);
    };
  }, [refreshCount]);

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#c2905e' }}>
            {t('title')}
          </h1>
          {user && (
            <p className="text-white/70">{t('welcomeBack', { username: user.username })}</p>
          )}
        </div>
        <button
          onClick={() => setRefreshCount((value) => value + 1)}
          className="px-4 py-2 rounded-lg transition-all duration-200 text-white"
          style={{
            backgroundColor: 'rgba(194, 144, 94, 0.3)',
            border: '1px solid rgba(194, 144, 94, 0.5)',
          }}
        >
          🔄 {t('refresh')}
        </button>
      </div>
      {refreshError && <p role="alert" className="mb-4 text-amber-200">{t('loadFailed')}</p>}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-white text-xl">{t('loading')}</div>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 mb-8">
            <StatCard
              title={t('onlineDevices')}
              value={stats.onlineDevices}
              icon="✓"
              color="#10b981"
            />
            <StatCard
              title={t('warningDevices')}
              value={stats.warningDevices}
              icon="⚠"
              color="#f59e0b"
            />
            <StatCard
              title={t('offlineDevices')}
              value={stats.offlineDevices}
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
      ) : null}
    </div>
  );
}

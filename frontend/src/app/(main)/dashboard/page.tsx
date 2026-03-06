'use client';

import StatCard from '@/components/StatCard';
import DeviceGrid from '@/components/DeviceGrid';
import { useEffect, useState } from 'react';
import { authApi, dashboardApi } from '@/lib/api';
import { DashboardStatsResponse } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
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
            仪表盘
          </h1>
          {user && (
            <p className="text-white/70">欢迎回来，{user.username}</p>
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
          🔄 刷新
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-white text-xl">加载仪表盘...</div>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
              title="在线设备"
              value={stats.onlineDevices}
              icon="✓"
              color="#10b981"
            />
            <StatCard
              title="告警设备"
              value={stats.warningDevices}
              icon="⚠"
              color="#f59e0b"
            />
            <StatCard
              title="离线设备"
              value={stats.offlineDevices}
              icon="✗"
              color="#ef4444"
            />
            <StatCard
              title="未读短信"
              value={stats.totalUnreadMessages}
              icon="💬"
              color="#c2905e"
            />
            <StatCard
              title="未接来电"
              value={stats.totalUnreadCalls}
              icon="📞"
              color="#ef4444"
            />
          </div>

          <div className="mb-6 text-white/50 text-sm flex justify-between items-center">
            <span>最后更新：{lastUpdated.toLocaleTimeString()}</span>
            <span className="text-white/30">每 30 秒自动刷新</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-6">
              我的设备（{stats.devices.length}）
            </h2>
            <DeviceGrid devices={stats.devices} />
          </div>
        </>
      ) : (
        <div className="text-white text-center">加载仪表盘数据失败</div>
      )}
    </div>
  );
}

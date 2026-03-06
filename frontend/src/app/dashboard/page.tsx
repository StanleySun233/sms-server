'use client';

import AuthGuard from '@/components/AuthGuard';
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
    try {
      const response = await dashboardApi.getStats();
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await authApi.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUser(), fetchStats()]);
      setLoading(false);
    };

    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleRefresh = () => {
    fetchStats();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen" style={{ backgroundColor: 'rgb(45, 45, 45)' }}>
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#c2905e' }}>
                SMS Server Dashboard
              </h1>
              {user && (
                <p className="text-white/70">Welcome back, {user.username}!</p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 rounded-lg transition-all duration-200 text-white"
                style={{
                  backgroundColor: 'rgba(194, 144, 94, 0.3)',
                  border: '1px solid rgba(194, 144, 94, 0.5)',
                }}
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => router.push('/devices/new')}
                className="px-4 py-2 rounded-lg transition-all duration-200 text-white"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.3)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                }}
              >
                + New Device
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg transition-all duration-200 text-white"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.3)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                }}
              >
                Logout
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-white text-xl">Loading dashboard...</div>
            </div>
          ) : stats ? (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <StatCard
                  title="Online Devices"
                  value={stats.onlineDevices}
                  icon="✓"
                  color="#10b981"
                />
                <StatCard
                  title="Warning Devices"
                  value={stats.warningDevices}
                  icon="⚠"
                  color="#f59e0b"
                />
                <StatCard
                  title="Offline Devices"
                  value={stats.offlineDevices}
                  icon="✗"
                  color="#ef4444"
                />
                <StatCard
                  title="Unread Messages"
                  value={stats.totalUnreadMessages}
                  icon="💬"
                  color="#c2905e"
                />
                <StatCard
                  title="Missed Calls"
                  value={stats.totalUnreadCalls}
                  icon="📞"
                  color="#ef4444"
                />
              </div>

              {/* Last Updated */}
              <div className="mb-6 text-white/50 text-sm flex justify-between items-center">
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                <span className="text-white/30">Auto-refresh every 30s</span>
              </div>

              {/* Device Grid */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-white mb-6">
                  Your Devices ({stats.devices.length})
                </h2>
                <DeviceGrid devices={stats.devices} />
              </div>
            </>
          ) : (
            <div className="text-white text-center">Failed to load dashboard data</div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

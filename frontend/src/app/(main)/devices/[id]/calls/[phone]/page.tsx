'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ElMessage } from 'element-plus';
import { missedCallApi } from '@/lib/api';
import { MissedCallResponse } from '@/lib/types';
import MissedCallCard from '@/components/MissedCallCard';

export default function CallHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);
  const phone = decodeURIComponent(params.phone as string);

  const [calls, setCalls] = useState<MissedCallResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalls = async () => {
    const response = await missedCallApi.getCallHistory(deviceId, phone);
    setCalls(response.data.data || []);
  };

  useEffect(() => {
    fetchCalls().catch((error: any) => ElMessage.error(error.message || '加载来电记录失败')).finally(() => setLoading(false));
  }, [deviceId, phone]);

  const handleMarkAsRead = async (callId: number) => {
    await missedCallApi.markAsRead([callId]);
    ElMessage.success('已标记为已读');
    fetchCalls();
  };

  const handleMarkAllAsRead = async () => {
    const unreadCallIds = calls.filter((call) => !call.readAt).map((call) => call.id);
    if (unreadCallIds.length === 0) {
      ElMessage.info('已全部标记为已读');
      return;
    }
    await missedCallApi.markAsRead(unreadCallIds);
    ElMessage.success(`已标记 ${unreadCallIds.length} 条为已读`);
    fetchCalls();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    );
  }

  const unreadCount = calls.filter((call) => !call.readAt).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">来电记录</h1>
            <p className="text-white/70 text-lg">{phone}</p>
          </div>
          <button
            onClick={() => router.push(`/devices/${deviceId}/calls`)}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            返回未接来电
          </button>
        </div>

        {unreadCount > 0 && (
          <div className="mb-4">
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.3)',
                color: '#fff',
              }}
            >
              全部标记为已读（{unreadCount}）
            </button>
          </div>
        )}

        {calls.length === 0 ? (
          <div
            className="rounded-2xl p-8 shadow-xl text-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <p className="text-white/70 text-lg">暂无来电记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => (
              <MissedCallCard key={call.id} call={call} onMarkAsRead={handleMarkAsRead} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ElMessage } from 'element-plus';
import { missedCallApi } from '@/lib/api';
import { MissedCallSummary } from '@/lib/types';

export default function MissedCallsPage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);

  const [calls, setCalls] = useState<MissedCallSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const response = await missedCallApi.getMissedCalls(deviceId);
        setCalls(response.data.data || []);
      } catch (error: any) {
        ElMessage.error(error.message || 'Failed to load missed calls');
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, [deviceId]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })}`;
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Missed Calls</h1>
          <button
            onClick={() => router.push(`/devices/${deviceId}`)}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            Back to Device
          </button>
        </div>

        {calls.length === 0 ? (
          <div
            className="rounded-2xl p-8 shadow-xl text-center"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <p className="text-white/70 text-lg">No missed calls</p>
          </div>
        ) : (
          <div className="space-y-4">
            {calls.map((call) => (
              <div
                key={call.phone}
                className="rounded-2xl p-6 shadow-xl cursor-pointer transition-all duration-300 hover:scale-102"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
                onClick={() => router.push(`/devices/${deviceId}/calls/${encodeURIComponent(call.phone)}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Phone icon */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="#ef4444"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                        />
                      </svg>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-white">{call.phone}</h3>
                      <p className="text-white/60 text-sm">{formatTimestamp(call.lastCallTime)}</p>
                    </div>
                  </div>

                  {/* Count badge */}
                  <div
                    className="px-4 py-2 rounded-full font-medium"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                    }}
                  >
                    {call.count} {call.count === 1 ? 'call' : 'calls'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

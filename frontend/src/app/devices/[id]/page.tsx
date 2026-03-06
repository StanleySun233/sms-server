'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ElMessage } from 'element-plus';
import { deviceApi } from '@/lib/api';
import { Device } from '@/lib/types';
import StatusIndicator from '@/components/StatusIndicator';
import CopyButton from '@/components/CopyButton';

export default function DeviceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);

  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const response = await deviceApi.get(deviceId);
        setDevice(response.data);
      } catch (error: any) {
        ElMessage.error(error.message || 'Failed to load device');
        router.push('/devices');
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDevice, 30000);
    return () => clearInterval(interval);
  }, [deviceId, router]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this device? This action cannot be undone.')) {
      return;
    }

    try {
      await deviceApi.delete(deviceId);
      ElMessage.success('Device deleted successfully');
      router.push('/devices');
    } catch (error: any) {
      ElMessage.error(error.message || 'Failed to delete device');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!device) return null;

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/webhook/${device.webhookToken}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">{device.alias}</h1>
          <button
            onClick={() => router.push('/devices')}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            Back to Devices
          </button>
        </div>

        <div
          className="rounded-2xl p-8 shadow-xl mb-6"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <h2 className="text-2xl font-semibold text-white mb-6">Device Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-white/70 mb-2">Status</label>
              <StatusIndicator status={device.status} />
            </div>

            <div>
              <label className="block text-white/70 mb-2">Webhook Token</label>
              <div className="bg-black/30 p-4 rounded-lg mb-2">
                <code className="text-green-400 break-all">{device.webhookToken}</code>
              </div>
              <CopyButton text={device.webhookToken} label="Copy Token" />
            </div>

            <div>
              <label className="block text-white/70 mb-2">Webhook URL</label>
              <div className="bg-black/30 p-4 rounded-lg mb-2">
                <code className="text-green-400 break-all">{webhookUrl}</code>
              </div>
              <CopyButton text={webhookUrl} label="Copy URL" />
            </div>

            {device.currentPhoneNumber && (
              <div>
                <label className="block text-white/70 mb-2">Current Phone Number</label>
                <div className="text-white text-lg">{device.currentPhoneNumber}</div>
              </div>
            )}

            {device.lastHeartbeatAt && (
              <div>
                <label className="block text-white/70 mb-2">Last Heartbeat</label>
                <div className="text-white text-lg">
                  {new Date(device.lastHeartbeatAt).toLocaleString()}
                </div>
              </div>
            )}

            <div>
              <label className="block text-white/70 mb-2">Created</label>
              <div className="text-white text-lg">
                {new Date(device.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => router.push(`/devices/${device.id}/edit`)}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: '#c2905e',
                color: '#fff',
              }}
            >
              Edit Device
            </button>
            <button
              onClick={handleDelete}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                color: '#fff',
              }}
            >
              Delete Device
            </button>
          </div>
        </div>

        <div
          className="rounded-2xl p-8 shadow-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push(`/devices/${device.id}/messages`)}
              className="rounded-lg p-6 text-left transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="text-white text-lg font-medium mb-2">Messages</div>
              <p className="text-white/70 text-sm">View conversations and send messages</p>
            </button>

            <button
              onClick={() => router.push(`/devices/${device.id}/calls`)}
              className="rounded-lg p-6 text-left transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <div className="flex items-center gap-2 text-white text-lg font-medium mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="#ef4444"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                  />
                </svg>
                Missed Calls
              </div>
              <p className="text-white/70 text-sm">View missed call history</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

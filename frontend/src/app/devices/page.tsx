'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ElMessage } from 'element-plus';
import { deviceApi } from '@/lib/api';
import { Device } from '@/lib/types';
import DeviceCard from '@/components/DeviceCard';

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const response = await deviceApi.list();
      setDevices(response.data);
    } catch (error: any) {
      ElMessage.error(error.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deviceApi.delete(id);
      ElMessage.success('Device deleted successfully');
      fetchDevices();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">My Devices</h1>
        <button
          onClick={() => router.push('/devices/new')}
          className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: '#c2905e',
            color: '#fff',
          }}
        >
          Add Device
        </button>
      </div>

      {devices.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <h2 className="text-2xl font-semibold text-white mb-4">No Devices Yet</h2>
          <p className="text-white/70 mb-6">Get started by adding your first device</p>
          <button
            onClick={() => router.push('/devices/new')}
            className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
            style={{
              backgroundColor: '#c2905e',
              color: '#fff',
            }}
          >
            Add Your First Device
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

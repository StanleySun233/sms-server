'use client';

import { Device } from '@/lib/types';
import StatusIndicator from './StatusIndicator';
import { useRouter } from 'next/navigation';

interface DeviceCardProps {
  device: Device;
  onDelete?: (id: number) => void;
}

export default function DeviceCard({ device, onDelete }: DeviceCardProps) {
  const router = useRouter();

  return (
    <div
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
          <StatusIndicator status={device.status} />
        </div>
      </div>

      <div className="space-y-2 text-white/70 text-sm">
        {device.currentPhoneNumber && (
          <div>
            <span className="font-medium">Phone:</span> {device.currentPhoneNumber}
          </div>
        )}
        {device.lastHeartbeatAt && (
          <div>
            <span className="font-medium">Last Heartbeat:</span>{' '}
            {new Date(device.lastHeartbeatAt).toLocaleString()}
          </div>
        )}
        <div>
          <span className="font-medium">Created:</span>{' '}
          {new Date(device.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/devices/${device.id}/edit`);
          }}
          className="px-4 py-2 rounded-lg transition-all duration-200"
          style={{
            backgroundColor: 'rgba(194, 144, 94, 0.3)',
            color: '#fff',
          }}
        >
          Edit
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Are you sure you want to delete this device?')) {
                onDelete(device.id);
              }
            }}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.3)',
              color: '#fff',
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

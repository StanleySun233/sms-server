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
            <span className="font-medium">号码：</span> {device.currentPhoneNumber}
          </div>
        )}
        {device.lastHeartbeatAt && (
          <div>
            <span className="font-medium">最后心跳：</span>{' '}
            {new Date(device.lastHeartbeatAt).toLocaleString()}
          </div>
        )}
        <div>
          <span className="font-medium">创建时间：</span>{' '}
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
          编辑
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('确定要删除该设备吗？')) {
                onDelete(device.id);
              }
            }}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.3)',
              color: '#fff',
            }}
          >
            删除
          </button>
        )}
      </div>
    </div>
  );
}

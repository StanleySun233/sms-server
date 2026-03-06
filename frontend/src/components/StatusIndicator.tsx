'use client';

interface StatusIndicatorProps {
  status: 'online' | 'warning' | 'offline';
}

const statusColors = {
  online: '#10b981',
  warning: '#f59e0b',
  offline: '#ef4444',
};

const statusLabels = {
  online: '在线',
  warning: '告警',
  offline: '离线',
};

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full animate-pulse"
        style={{ backgroundColor: statusColors[status] }}
      />
      <span className="text-white/90 capitalize">{statusLabels[status]}</span>
    </div>
  );
}

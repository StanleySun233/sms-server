'use client';

import { useTranslations } from 'next-intl';

interface StatusIndicatorProps {
  status: 'online' | 'warning' | 'offline';
}

const statusColors = {
  online: '#10b981',
  warning: '#f59e0b',
  offline: '#ef4444',
};

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  const t = useTranslations('status');
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full animate-pulse"
        style={{ backgroundColor: statusColors[status] }}
      />
      <span className="text-white/90">{t(status)}</span>
    </div>
  );
}

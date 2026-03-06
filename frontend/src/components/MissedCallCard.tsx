'use client';

import { MissedCallResponse } from '@/lib/types';

interface MissedCallCardProps {
  call: MissedCallResponse;
  onMarkAsRead?: (callId: number) => void;
}

export default function MissedCallCard({ call, onMarkAsRead }: MissedCallCardProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    // Show relative time for recent calls, absolute time for older ones
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

  return (
    <div
      className={`rounded-lg p-4 shadow-md transition-all duration-200 ${
        call.readAt ? 'opacity-60' : ''
      }`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        border: call.readAt
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(239, 68, 68, 0.3)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Phone icon with missed call indicator */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: call.readAt ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke={call.readAt ? '#fff' : '#ef4444'}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
              />
            </svg>
          </div>

          <div>
            <p className="text-white font-medium">{call.phone}</p>
            <p className="text-white/60 text-sm">{formatTimestamp(call.callTime)}</p>
          </div>
        </div>

        {!call.readAt && onMarkAsRead && (
          <button
            onClick={() => onMarkAsRead(call.id)}
            className="px-3 py-1 rounded-md text-sm transition-all duration-200 hover:opacity-80"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.3)',
              color: '#fff',
            }}
          >
            Mark Read
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import { SmsMessage } from '@/lib/types';
import { formatDateTime } from '@/lib/dateUtils';

interface MessageBubbleProps {
  message: SmsMessage;
  deviceId?: number;
  onRetry?: (messageId: number) => void;
}

export default function MessageBubble({ message, deviceId, onRetry }: MessageBubbleProps) {
  const isSent = message.direction === 'sent';
  const status = message.status || 'pending';
  const showDot = isSent;
  const dotColor =
    status === 'failed'
      ? 'bg-red-500'
      : status === 'pending'
        ? 'bg-gray-400'
        : 'bg-green-500';
  const canRetry = isSent && status === 'failed' && onRetry && deviceId;

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4 items-center gap-2`}>
      {showDot && (
        <button
          type="button"
          onClick={canRetry ? () => onRetry(message.id) : undefined}
          disabled={!canRetry}
          className={`shrink-0 w-2.5 h-2.5 rounded-full border border-white/30 ${dotColor} ${canRetry ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
          title={status === 'failed' ? 'Retry' : status === 'pending' ? 'Pending' : 'Sent'}
        />
      )}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
          isSent ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}
        style={{
          backgroundColor: isSent ? '#c2905e' : 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <p className="text-white break-words">{message.content}</p>
        <div className={`text-xs mt-1 flex items-center gap-1.5 ${isSent ? 'text-white/70' : 'text-white/50'}`}>
          <span>{formatDateTime(message.createdAt)}</span>
          {!isSent && message.readAt && <span className="text-white/40">已读</span>}
        </div>
      </div>
    </div>
  );
}

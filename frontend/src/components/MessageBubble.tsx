'use client';

import { SmsMessage } from '@/lib/types';
import { formatDateTime } from '@/lib/dateUtils';
import { useTranslations } from 'next-intl';

const statusLabels = {
  pending: 'statusPending',
  sent: 'statusSent',
  delivered: 'statusDelivered',
  failed: 'statusFailed',
  dispatching: 'statusDispatching',
  submitted: 'statusSubmitted',
  unknown: 'statusUnknown',
  expired: 'statusExpired',
} as const;

interface MessageBubbleProps {
  message: SmsMessage;
  deviceId?: number;
  onRetry?: (messageId: number) => void;
}

export default function MessageBubble({ message, deviceId, onRetry }: MessageBubbleProps) {
  const t = useTranslations('devices');
  const tMessages = useTranslations('messages');
  const isSent = message.direction === 'sent';
  const status = message.status || 'pending';
  const canRetry = isSent && (status === 'failed' || status === 'expired') && onRetry && deviceId;

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4 items-center gap-2`}>
      <div
        className={`max-w-[90%] sm:max-w-[75%] min-w-0 rounded-2xl px-4 py-3 shadow-md ${
          isSent ? 'rounded-br-sm' : 'rounded-bl-sm'
        }`}
        style={{
          backgroundColor: isSent ? '#c2905e' : 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <p className="text-white break-words whitespace-pre-wrap">{message.content}</p>
        <div className={`text-xs mt-1 flex flex-wrap items-center gap-1.5 ${isSent ? 'text-white/80' : 'text-white/60'}`}>
          <span>{formatDateTime(message.createdAt)}</span>
          {isSent && <span>{t(statusLabels[status])}</span>}
          {canRetry && <button type="button" onClick={() => onRetry(message.id)} className="underline">{t('retrySend')}</button>}
          {!isSent && message.readAt && <span>{tMessages('readLabel')}</span>}
        </div>
      </div>
    </div>
  );
}

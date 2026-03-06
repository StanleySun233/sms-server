'use client';

import { SmsMessage } from '@/lib/types';

interface MessageBubbleProps {
  message: SmsMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isSent = message.direction === 'sent';

  return (
    <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}>
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
        <div className={`text-xs mt-1 ${isSent ? 'text-white/70' : 'text-white/50'}`}>
          {new Date(message.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
          {isSent && (
            <span className="ml-2">
              {message.status === 'delivered' ? '✓✓' : message.status === 'sent' ? '✓' : '⏱'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

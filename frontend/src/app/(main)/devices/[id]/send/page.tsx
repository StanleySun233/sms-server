'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ElMessage } from 'element-plus';
import { smsApi } from '@/lib/api';

export default function DeviceSendPage() {
  const t = useTranslations('devices');
  const tMessages = useTranslations('messages');
  const router = useRouter();
  const params = useParams();
  const deviceId = parseInt(params.id as string);

  const [sendPhone, setSendPhone] = useState('');
  const [sendContent, setSendContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = sendPhone.trim();
    const content = sendContent.trim();
    if (!phone || !content || sending) return;
    setSending(true);
    smsApi.sendMessage(deviceId, { phone, content })
      .then(() => {
        setSendPhone('');
        setSendContent('');
        ElMessage.success(t('sendQueuedSuccess'));
      })
      .catch((err: Error) => ElMessage.error(err.message || t('loadFailed')))
      .finally(() => setSending(false));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">{t('sendSms')}</h1>
          <button
            onClick={() => router.push(`/devices/${deviceId}`)}
            className="px-4 py-2 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
            }}
          >
            {tMessages('backToDevice')}
          </button>
        </div>

        <div
          className="rounded-2xl p-8 shadow-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <form onSubmit={handleSendSms} className="space-y-4">
            <div>
              <label className="block text-white/70 mb-2">{t('phone')}</label>
              <input
                type="text"
                value={sendPhone}
                onChange={(e) => setSendPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                disabled={sending}
                className="w-full px-4 py-3 rounded-lg text-white placeholder-white/50"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              />
            </div>
            <div>
              <label className="block text-white/70 mb-2">{t('contentLabel')}</label>
              <textarea
                value={sendContent}
                onChange={(e) => setSendContent(e.target.value)}
                placeholder={t('messagePlaceholder')}
                disabled={sending}
                rows={4}
                className="w-full px-4 py-3 rounded-lg text-white placeholder-white/50 resize-y"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={sending || !sendPhone.trim() || !sendContent.trim()}
              className="px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: '#c2905e',
                color: '#fff',
              }}
            >
              {sending ? t('sending') : t('sendButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

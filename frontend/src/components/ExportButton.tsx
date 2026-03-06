'use client';

import { useTranslations } from 'next-intl';
import { smsApi } from '@/lib/api';
import { ElMessage } from 'element-plus';
import { SmsMessage } from '@/lib/types';
import { formatDateTime } from '@/lib/dateUtils';

interface ExportButtonProps {
  deviceId: number;
  receiverPhone?: string;
  phone?: string;
}

function escapeCsvCell(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildCsv(messages: SmsMessage[]): string {
  const BOM = '\uFEFF';
  const header = 'ID,Phone Number,Content,Direction,Status,Created At,Read At';
  const rows = messages
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((m) =>
      [
        m.id,
        escapeCsvCell(m.phoneNumber),
        escapeCsvCell(m.content),
        m.direction,
        m.status,
        formatDateTime(m.createdAt),
        m.readAt ? formatDateTime(m.readAt) : '',
      ].join(',')
    );
  return BOM + header + '\n' + rows.join('\n');
}

export default function ExportButton({ deviceId, receiverPhone, phone }: ExportButtonProps) {
  const t = useTranslations('messages');

  const handleExport = async () => {
    const response = await smsApi.searchMessages(deviceId, {
      receiverPhone: receiverPhone ?? undefined,
      phone: phone ?? undefined,
    });
    const list: SmsMessage[] = response.data?.data ?? [];
    const csv = buildCsv(list);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `messages_${deviceId}_${receiverPhone || ''}_${phone || 'all'}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    ElMessage.success(t('exportSuccess'));
  };

  return (
    <button
      onClick={() => handleExport().catch((error: any) => ElMessage.error(error.message || t('exportFailed')))}
      className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#fff',
      }}
    >
      {t('exportCsv')}
    </button>
  );
}

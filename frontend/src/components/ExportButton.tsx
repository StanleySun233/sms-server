'use client';

import { useTranslations } from 'next-intl';
import { smsApi } from '@/lib/api';
import { ElMessage } from 'element-plus';

interface ExportButtonProps {
  deviceId: number;
  receiverPhone?: string;
  phone?: string;
}

export default function ExportButton({ deviceId, receiverPhone, phone }: ExportButtonProps) {
  const t = useTranslations('messages');

  const handleExport = async () => {
    const response = await smsApi.exportMessages(deviceId, receiverPhone, phone);
    const blob = new Blob([response.data], { type: 'text/csv' });
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

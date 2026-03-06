'use client';

import { smsApi } from '@/lib/api';
import { ElMessage } from 'element-plus';

interface ExportButtonProps {
  deviceId: number;
  phone?: string;
}

export default function ExportButton({ deviceId, phone }: ExportButtonProps) {
  const handleExport = async () => {
    try {
      const response = await smsApi.exportMessages(deviceId, phone);

      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `messages_${deviceId}_${phone || 'all'}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      ElMessage.success('消息已导出');
    } catch (error: any) {
      ElMessage.error(error.message || '导出失败');
    }
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#fff',
      }}
    >
      导出 CSV
    </button>
  );
}

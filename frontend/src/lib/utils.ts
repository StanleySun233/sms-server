import { formatDateTime } from '@/lib/dateUtils';

export const formatDate = (dateString: string): string => formatDateTime(dateString);

export const formatPhoneNumber = (phoneNumber: string): string => {
  const cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phoneNumber;
};

export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    ACTIVE: 'text-green-400',
    INACTIVE: 'text-gray-400',
    SUSPENDED: 'text-red-400',
    PENDING: 'text-yellow-400',
    SENT: 'text-blue-400',
    DELIVERED: 'text-green-400',
    FAILED: 'text-red-400',
  };

  return statusColors[status] || 'text-gray-400';
};

export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} 秒前`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} 分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} 小时前`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} 天前`;

  return formatDate(dateString);
};

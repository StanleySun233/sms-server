import axios, { AxiosInstance, AxiosError } from 'axios';

export const TOKEN_KEY = 'auth_token';

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // @ts-ignore - runtime config injected via env-config.js
    return window.__ENV__?.NEXT_PUBLIC_API_URL || '/api';
  }
  return '/api';
};

const apiClient: AxiosInstance = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

function getResponseMessage(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string') {
    return (data as { message: string }).message;
  }
  return '';
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      const isPublicPage = /^\/(login|register)$/.test(window.location.pathname);
      if (!isAuthCheck && !isPublicPage) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
    }
    const msg = getResponseMessage(error.response?.data);
    const errorMessage = msg || error.message || '发生未知错误';
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;

// Auth API functions
export const authApi = {
  register: (data: { username: string; password: string; email: string }) =>
    apiClient.post('/auth/register', data),

  login: (data: { username: string; password: string }) =>
    apiClient.post('/auth/login', data),

  logout: () => apiClient.post('/auth/logout'),

  getCurrentUser: () => apiClient.get('/auth/me'),

  updateProfile: (data: { email: string }) =>
    apiClient.put('/auth/me', data),

  updatePreferences: (data: { locale: string }) =>
    apiClient.put('/auth/me/preferences', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put('/auth/password', data),
};

// Device API functions
export const deviceApi = {
  list: () => apiClient.get('/devices'),
  get: (id: number) => apiClient.get(`/devices/${id}`),
  create: (data: { alias: string }) => apiClient.post('/devices', data),
  update: (id: number, data: { alias: string }) => apiClient.put(`/devices/${id}`, data),
  delete: (id: number) => apiClient.delete(`/devices/${id}`),
  checkTransferUsername: (username: string) =>
    apiClient.get<{ exists: boolean; username: string | null }>('/devices/transfer/check-username', { params: { username } }),
  transfer: (deviceId: number, username: string) =>
    apiClient.post(`/devices/${deviceId}/transfer`, { username }),
  getWebhookLogs: (deviceId: number, page: number = 1, size: number = 20) =>
    apiClient.get(`/devices/${deviceId}/webhook-logs`, { params: { page, size } }),
};

// SMS API functions
export const smsApi = {
  getMessageLines: (deviceId: number, page?: number, size?: number) =>
    apiClient.get(`/devices/${deviceId}/messages/lines`, {
      params: page && size ? { page, size } : {}
    }),

  getConversations: (deviceId: number, receiverPhone?: string) =>
    apiClient.get(`/devices/${deviceId}/conversations`, {
      params: receiverPhone != null ? { receiverPhone } : {}
    }),

  getMessages: (deviceId: number, phone: string, page: number = 1, size: number = 50, receiverPhone?: string) =>
    apiClient.get(`/devices/${deviceId}/messages`, {
      params: { phone, page, size, ...(receiverPhone != null ? { receiverPhone } : {}) }
    }),

  sendMessage: (deviceId: number, data: { phone: string; content: string }) =>
    apiClient.post(`/devices/${deviceId}/messages`, data),

  retryMessage: (deviceId: number, messageId: number) =>
    apiClient.post(`/devices/${deviceId}/messages/retry`, { messageId }),

  getSendLogs: (deviceId: number, page?: number, size?: number, keyword?: string) =>
    apiClient.get(`/devices/${deviceId}/send-logs`, {
      params: {
        ...(page && size ? { page, size } : {}),
        ...(keyword ? { keyword } : {})
      }
    }),

  markAsRead: (messageIds: number[]) =>
    apiClient.put('/messages/read', { messageIds }),

  searchMessages: (deviceId: number, params: {
    receiverPhone?: string;
    keyword?: string;
    phone?: string;
    start_time?: string;
    end_time?: string;
  }) => apiClient.get(`/devices/${deviceId}/messages/search`, { params }),
};

// Missed Call API functions
export const missedCallApi = {
  getMissedCalls: (deviceId: number) => apiClient.get(`/devices/${deviceId}/missed-calls`),
  getCallHistory: (deviceId: number, phone: string) =>
    apiClient.get(`/devices/${deviceId}/calls`, { params: { phone } }),
  markAsRead: (callIds: number[]) => apiClient.put('/calls/read', { callIds }),
  getUnreadCount: (deviceId: number) =>
    apiClient.get(`/devices/${deviceId}/missed-calls/unread-count`),
};

// Dashboard API functions
export const dashboardApi = {
  getStats: () => apiClient.get('/dashboard/stats'),
};

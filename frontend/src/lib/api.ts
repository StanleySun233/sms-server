import axios, { AxiosInstance, AxiosError } from 'axios';

export const TOKEN_KEY = 'auth_token';

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
  }
}

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
    return Promise.reject(new ApiError(errorMessage, error.response?.status));
  }
);

export default apiClient;

function requireApiSuccess<T extends { data: { code: number; message?: string } }>(response: T): T {
  if (response.data.code !== 200) {
    throw new ApiError(response.data.message || 'Request failed', response.data.code);
  }
  return response;
}

export type SmsDraft = { deviceId: number; phone: string; content: string; requestId: string };

export function identifySmsDraft(previous: SmsDraft | null, deviceId: number, phone: string, content: string): SmsDraft {
  if (previous?.deviceId === deviceId && previous.phone === phone && previous.content === content) {
    return previous;
  }
  return { deviceId, phone, content, requestId: crypto.randomUUID() };
}

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
  getMessageLines: (deviceId: number) =>
    apiClient.get(`/devices/${deviceId}/messages/lines`),

  getConversations: (deviceId: number, receiverPhone?: string, signal?: AbortSignal) =>
    apiClient.get(`/devices/${deviceId}/conversations`, {
      params: receiverPhone != null ? { receiverPhone } : {}, signal
    }),

  getMessages: (deviceId: number, phone: string, page: number = 1, size: number = 50, receiverPhone?: string, signal?: AbortSignal) =>
    apiClient.get(`/devices/${deviceId}/messages`, {
      params: { phone, page, size, ...(receiverPhone != null ? { receiverPhone } : {}) }, signal
    }),

  sendMessage: (deviceId: number, data: { phone: string; content: string; requestId: string }) =>
    apiClient.post(`/devices/${deviceId}/messages`, data),

  retryMessage: (deviceId: number, messageId: number) =>
    apiClient.post(`/devices/${deviceId}/messages/retry`, { messageId }),

  getSendLogs: (deviceId: number, limit: number = 20) =>
    apiClient.get(`/devices/${deviceId}/send-logs`, { params: { limit } }),

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
  getMissedCalls: (deviceId: number) => apiClient.get(`/devices/${deviceId}/missed-calls`).then(requireApiSuccess),
  getCallHistory: (deviceId: number, phone: string) =>
    apiClient.get(`/devices/${deviceId}/calls`, { params: { phone } }).then(requireApiSuccess),
  markAsRead: (callIds: number[]) => apiClient.put('/calls/read', { callIds }).then(requireApiSuccess),
  getUnreadCount: (deviceId: number) =>
    apiClient.get(`/devices/${deviceId}/missed-calls/unread-count`).then(requireApiSuccess),
};

// Dashboard API functions
export const dashboardApi = {
  getStats: () => apiClient.get('/dashboard/stats'),
};

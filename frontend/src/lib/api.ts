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

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    const errorMessage =
      (error.response?.data as any)?.message ||
      error.message ||
      'An unexpected error occurred';
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
};

// Device API functions
export const deviceApi = {
  list: () => apiClient.get('/devices'),
  get: (id: number) => apiClient.get(`/devices/${id}`),
  create: (data: { alias: string }) => apiClient.post('/devices', data),
  update: (id: number, data: { alias: string }) => apiClient.put(`/devices/${id}`, data),
  delete: (id: number) => apiClient.delete(`/devices/${id}`),
};

// SMS API functions
export const smsApi = {
  getConversations: (deviceId: number) =>
    apiClient.get(`/devices/${deviceId}/conversations`),

  getMessages: (deviceId: number, phone: string, page: number = 1, size: number = 50) =>
    apiClient.get(`/devices/${deviceId}/messages`, {
      params: { phone, page, size }
    }),

  sendMessage: (deviceId: number, data: { phone: string; content: string }) =>
    apiClient.post(`/devices/${deviceId}/messages`, data),

  markAsRead: (messageIds: number[]) =>
    apiClient.put('/messages/read', { messageIds }),

  searchMessages: (deviceId: number, params: {
    keyword?: string;
    phone?: string;
    start_time?: string;
    end_time?: string;
  }) => apiClient.get(`/devices/${deviceId}/messages/search`, { params }),

  exportMessages: (deviceId: number, phone?: string) =>
    apiClient.get(`/devices/${deviceId}/messages/export`, {
      params: { phone, format: 'csv' },
      responseType: 'blob'
    }),
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

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  role?: 'ADMIN' | 'USER';
  createdAt: string;
  updatedAt?: string;
  preferences?: { locale?: string };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Device Types
export interface Device {
  id: number;
  alias: string;
  webhookToken: string;
  status: 'online' | 'warning' | 'offline';
  lastHeartbeatAt?: string;
  currentPhoneNumber?: string;
  imei?: string;
  signalStrength?: number;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface CreateDeviceRequest {
  alias: string;
}

export interface UpdateDeviceRequest {
  alias: string;
}

// SMS Types
export interface SmsMessage {
  id: number;
  deviceId: number;
  phoneNumber: string;
  content: string;
  direction: 'sent' | 'received';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  createdAt: string;
  updatedAt: string;
  readAt?: string;
}

export interface LineSummary {
  receiverPhone: string;
  lastMessage: string | null;
  lastMessageDirection?: 'sent' | 'received';
  unreadCount: number;
  lastMessageTime: string | null;
}

export interface Conversation {
  phone: string;
  lastMessage: string;
  lastMessageDirection?: 'sent' | 'received';
  unreadCount: number;
  lastMessageTime: string;
}

export interface SendSmsRequest {
  phone: string;
  content: string;
}

export interface MarkReadRequest {
  messageIds: number[];
}

// Missed Call Types
export interface MissedCall {
  id: number;
  deviceId: number;
  fromNumber: string;
  timestamp: string;
  createdAt: string;
}

export interface MissedCallSummary {
  phone: string;
  count: number;
  lastCallTime: string;
}

export interface MissedCallResponse {
  id: number;
  phone: string;
  callTime: string;
  readAt?: string;
}

export interface MarkCallsReadRequest {
  callIds: number[];
}

// Dashboard Statistics Types
export interface DeviceStats {
  id: number;
  alias: string;
  status: 'online' | 'warning' | 'offline';
  unreadMessages: number;
  unreadCalls: number;
  lastHeartbeatAt?: string;
  currentPhoneNumber?: string;
  imei?: string;
  signalStrength?: number;
}

export interface DashboardStatsResponse {
  onlineDevices: number;
  warningDevices: number;
  offlineDevices: number;
  totalUnreadMessages: number;
  totalUnreadCalls: number;
  totalSentMessages: number;
  devices: DeviceStats[];
}

// Legacy Statistics Types (kept for compatibility)
export interface DeviceStatistics {
  deviceId: number;
  deviceName: string;
  totalSmsSent: number;
  totalSmsDelivered: number;
  totalSmsFailed: number;
  totalMissedCalls: number;
  lastHeartbeat: string;
}

export interface DashboardStatistics {
  totalDevices: number;
  activeDevices: number;
  totalSmsSent: number;
  totalSmsDelivered: number;
  totalSmsFailed: number;
  totalMissedCalls: number;
  deviceStatistics: DeviceStatistics[];
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

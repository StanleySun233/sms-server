export function parseUtcAndFormatLocal(isoString: string): string {
  const hasOffset = /Z|[+-]\d{2}:?\d{2}$/.test(isoString);
  const normalized = hasOffset ? isoString : isoString + 'Z';
  return new Date(normalized).toLocaleString();
}

export type DeviceStatus = 'online' | 'warning' | 'offline';

export function getDeviceStatusFromHeartbeat(lastHeartbeatAt: string | undefined): DeviceStatus {
  if (!lastHeartbeatAt) return 'offline';
  const hasOffset = /Z|[+-]\d{2}:?\d{2}$/.test(lastHeartbeatAt);
  const normalized = hasOffset ? lastHeartbeatAt : lastHeartbeatAt + 'Z';
  const heartbeatTime = new Date(normalized).getTime();
  const now = Date.now();
  const diffMin = (now - heartbeatTime) / 60000;
  if (diffMin < 0) return 'online';
  if (diffMin < 3) return 'online';
  if (diffMin < 5) return 'warning';
  return 'offline';
}

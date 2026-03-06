/** API dates are UTC ISO-8601; strings without offset are parsed as UTC. */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDateTime(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === 'string'
    ? (() => {
        const hasOffset = /Z|[+-]\d{2}:?\d{2}$/.test(isoOrDate);
        const normalized = hasOffset ? isoOrDate : isoOrDate + 'Z';
        return new Date(normalized);
      })()
    : isoOrDate;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function parseUtcAndFormatLocal(isoString: string): string {
  const hasOffset = /Z|[+-]\d{2}:?\d{2}$/.test(isoString);
  const normalized = hasOffset ? isoString : isoString + 'Z';
  return formatDateTime(new Date(normalized));
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

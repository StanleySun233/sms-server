export function parseUtcAndFormatLocal(isoString: string): string {
  const hasOffset = /Z|[+-]\d{2}:?\d{2}$/.test(isoString);
  const normalized = hasOffset ? isoString : isoString + 'Z';
  return new Date(normalized).toLocaleString();
}

export class ProviderHttpError extends Error {
  readonly statusCode?: number;
  readonly responseBody?: unknown;

  constructor(message: string, statusCode?: number, responseBody?: unknown) {
    super(message);
    this.name = 'ProviderHttpError';
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export function redactValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return value.replace(/[A-Za-z0-9+\/=]{8,}/g, '***');
  if (Array.isArray(value)) return value.map((v) => redactValue(v));
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (/token|secret|password|authorization|auth|key/i.test(k)) {
        out[k] = '***';
      } else {
        out[k] = redactValue(v);
      }
    }
    return out;
  }
  return value;
}
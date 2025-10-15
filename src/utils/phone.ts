export type SmsEncoding = 'GSM7' | 'UCS-2';

const GSM7_BASIC_CHARS =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\u0020!\"#¤%&'()*+,\-.\/0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXTENDED_CHARS = "^{}\\[~]|€";

function isGsm7Character(char: string): boolean {
  return GSM7_BASIC_CHARS.includes(char) || GSM7_EXTENDED_CHARS.includes(char);
}

export function detectEncoding(message: string, preferred: 'auto' | 'GSM7' | 'UCS-2'): SmsEncoding {
  if (preferred === 'GSM7') return 'GSM7';
  if (preferred === 'UCS-2') return 'UCS-2';
  for (const ch of message) {
    if (!isGsm7Character(ch)) return 'UCS-2';
  }
  return 'GSM7';
}

export type NormalizeResult = { ok: true; value: string } | { ok: false; error: string };

export function normalizePhoneNumberToE164(input: string): NormalizeResult {
  const trimmed = (input || '').trim();
  if (!trimmed) return { ok: false, error: 'Phone number is empty' };

  const cleaned = trimmed.replace(/[\s\-()\.]/g, '');

  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    if (!/^\d{8,15}$/.test(digits)) {
      return { ok: false, error: 'Invalid E.164 phone number format' };
    }
    return { ok: true, value: `+${digits}` };
  }

  if (cleaned.startsWith('00')) {
    const digits = cleaned.slice(2);
    if (!/^\d{8,15}$/.test(digits)) {
      return { ok: false, error: 'Invalid international number format after 00 prefix' };
    }
    return { ok: true, value: `+${digits}` };
  }

  // Local numbers cannot be reliably normalized without a country. Fail gracefully.
  return { ok: false, error: 'Local or national format provided; cannot infer country to build E.164' };
}
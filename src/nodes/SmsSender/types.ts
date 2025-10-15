import type { IExecuteFunctions } from 'n8n-workflow';

export type ProviderName = 'MessageMedia';
export type EncodingOption = 'auto' | 'GSM7' | 'UCS-2';
export type SmsStatus = 'queued' | 'sent' | 'failed';

export interface SmsMetaCost {
  currency: string;
  amount: number;
}

export interface SmsMeta {
  cost: SmsMetaCost;
  encoding: 'GSM7' | 'UCS-2';
  queuedAt: string; // ISO-8601
  rateLimitAppliedMs: number;
}

export interface SmsOutputItem {
  provider: ProviderName;
  to: string;
  from: string;
  message: string;
  status: SmsStatus;
  providerMessageId: string | null;
  error: string | null;
  raw?: unknown;
  meta: SmsMeta;
}

export interface ProviderSendParams {
  to: string;
  from: string;
  message: string;
  statusCallbackUrl?: string;
  encoding?: 'auto' | 'GSM7' | 'UCS-2';
  testMode?: boolean;
  providerRegion?: string;
  helpers: IExecuteFunctions['helpers'];
  credentials: Record<string, string>;
}

export interface ProviderSendResult {
  status: 'queued' | 'sent' | 'failed';
  providerMessageId?: string;
  raw?: unknown;
  error?: string;
  meta?: Record<string, unknown>;
}
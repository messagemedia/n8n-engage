import type { IExecuteFunctions } from 'n8n-workflow';

export interface ProviderStrategy {
  send(params: {
    to: string;
    from: string;
    message: string;
    statusCallbackUrl?: string;
    encoding?: 'auto' | 'GSM7' | 'UCS-2';
    testMode?: boolean;
    providerRegion?: string;
    helpers: IExecuteFunctions['helpers'];
    credentials: Record<string, string>;
  }): Promise<{
    status: 'queued' | 'sent' | 'failed';
    providerMessageId?: string;
    raw?: unknown;
    error?: string;
    meta?: Record<string, unknown>;
  }>;
}
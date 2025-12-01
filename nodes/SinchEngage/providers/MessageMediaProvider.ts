import type { IExecuteFunctions } from 'n8n-workflow';
import { ProviderStrategy } from './ProviderStrategy';
import { ProviderHttpError } from '../../../utils/errors';
import { makeMessageMediaRequest } from '../../../utils/messageMediaHttp';

interface MessageMediaCredentials {
  apiKey: string;
  apiSecret: string;
}

export class MessageMediaProvider implements ProviderStrategy {
  async send(params: {
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
  }> {
    const { to, from, message, testMode, helpers } = params;
    const { apiKey, apiSecret } = params.credentials as unknown as MessageMediaCredentials;

    // Avoid external network dependency in test mode; return synthetic response
    if (testMode) {
      return {
        status: 'queued',
        providerMessageId: 'test-mode-message-id',
        raw: { simulated: true, environment: 'testMode' },
        meta: { skippedNetwork: true },
      };
    }

    const url = 'https://api.messagemedia.com/v1/messages';

    // Build message object - only include source_number if from is provided
    const messageObj: Record<string, unknown> = {
      content: message,
      destination_number: to,
    };

    // Only add source_number if from field is provided and not empty
    if (from && from.trim() !== '') {
      messageObj.source_number = from;
    }

    const body = {
      messages: [messageObj],
    };

    try {
      // Cast helpers to provide access to context for shared utility
      const context = { helpers, getCredentials: async () => ({ apiKey, apiSecret }) } as any;
      const response = await makeMessageMediaRequest(context, {
        method: 'POST',
        url,
        body,
      });

      const raw = response as Record<string, unknown>;
      let id: string | undefined;
      const messages = (raw && (raw.messages as Array<Record<string, unknown>>)) || [];
      if (messages && messages.length > 0) {
        id = messages[0]?.message_id as string | undefined;
      }

      return {
        status: 'queued',
        providerMessageId: id,
        raw,
      };
    } catch (err) {
      const error = err as { statusCode?: number; message?: string; error?: unknown };
      throw new ProviderHttpError(
        error.message || 'MessageMedia request failed',
        error.statusCode,
        error.error,
      );
    }
  }
}
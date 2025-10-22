import { describe, it, expect, beforeEach, vi } from 'vitest';
import nock from 'nock';

// Minimal stub of n8n-workflow to satisfy dynamic imports in execute tests
vi.mock('n8n-workflow', async () => {
  class NodeApiError extends Error {
    constructor(node: any, options: { message: string }) {
      super(options.message);
    }
  }
  return {
    NodeApiError,
  } as any;
});

import { detectEncoding, normalizePhoneNumberToE164 } from '../src/utils/phone';
import { MessageMediaProvider } from '../src/nodes/SinchEngage/providers/MessageMediaProvider';

const helpers: any = {
  request: async (opts: any) => {
    const fetch = await import('node-fetch');
    const res = await (fetch.default as any)(opts.uri, {
      method: opts.method || 'GET',
      headers: opts.headers,
      body: opts.form ? new URLSearchParams(opts.form).toString() : opts.json ? JSON.stringify(opts.body) : opts.body,
    });
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (!res.ok) {
        const err: any = new Error(json?.message || 'HTTP error');
        err.statusCode = res.status;
        err.error = json;
        throw err;
      }
      return json;
    } catch (e) {
      if (!res.ok) {
        const err: any = new Error(text || 'HTTP error');
        err.statusCode = res.status;
        err.error = text;
        throw err;
      }
      return text;
    }
  },
};

describe('phone utils', () => {
  it('normalizes E.164 and rejects local', () => {
    expect(normalizePhoneNumberToE164('+14155552671')).toEqual({ ok: true, value: '+14155552671' });
    expect(normalizePhoneNumberToE164('0014155552671')).toEqual({ ok: true, value: '+14155552671' });
    expect(normalizePhoneNumberToE164('415-555-2671')).toEqual({ ok: false, error: expect.any(String) });
  });

  it('detects encoding', () => {
    expect(detectEncoding('Hello', 'auto')).toBe('GSM7');
    expect(detectEncoding('こんにちは', 'auto')).toBe('UCS-2');
    expect(detectEncoding('abc', 'GSM7')).toBe('GSM7');
    expect(detectEncoding('abc', 'UCS-2')).toBe('UCS-2');
  });
});

describe('MessageMediaProvider', () => {
  beforeEach(() => nock.cleanAll());

  it('queues message', async () => {
    const scope = nock('https://api.messagemedia.com')
      .post('/v1/messages')
      .reply(202, { messages: [{ message_id: 'mm123' }] });

    const provider = new MessageMediaProvider();
    const res = await provider.send({
      to: '+15551234567',
      from: '+15557654321',
      message: 'Hello',
      helpers,
      credentials: { apiKey: 'k', apiSecret: 's' },
    });
    expect(res.status).toBe('queued');
    expect(res.providerMessageId).toBe('mm123');
    expect(scope.isDone()).toBe(true);
  });
});

// Removed external httpbin dependency: testMode now returns synthetic response without network
describe('test mode synthetic response', () => {
  it('returns simulated queued result without HTTP', async () => {
    const mm = new MessageMediaProvider();
    const res = await mm.send({
      to: '+1',
      from: '+2',
      message: 'Hi',
      helpers: { httpRequest: vi.fn(), request: vi.fn() } as any, // minimal helpers stub
      credentials: { apiKey: 'k', apiSecret: 's' },
      testMode: true,
    });
    expect(res.status).toBe('queued');
    expect(res.providerMessageId).toBe('test-mode-message-id');
    expect(res.raw).toMatchObject({ simulated: true });
  });
});

// Removed legacy execute tests referencing sandbox & rate limiting features not present in current implementation.
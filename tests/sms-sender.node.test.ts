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
import { MessageMediaProvider } from '../src/nodes/SmsSender/providers/MessageMediaProvider';

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

describe('test mode and sandbox', () => {
  beforeEach(() => nock.cleanAll());

  it('testMode redirects to httpbin', async () => {
    const scope = nock('https://httpbin.org').post('/post').reply(200, { echoed: true });
    const mm = new MessageMediaProvider();
    const res = await mm.send({
      to: '+1',
      from: '+2',
      message: 'Hi',
      helpers,
      credentials: { apiKey: 'k', apiSecret: 's' },
      testMode: true,
    });
    expect(res.status).toBe('queued');
    expect(scope.isDone()).toBe(true);
  });
});

describe('SmsSender node execute', () => {
  beforeEach(() => nock.cleanAll());

  function buildFakeThis(paramsPerItem: Array<Record<string, any>>): any {
    return {
      getInputData() {
        return paramsPerItem.map(() => ({ json: {} }));
      },
      getNodeParameter(name: string, itemIndex: number) {
        return paramsPerItem[itemIndex][name];
      },
      getNode() {
        return { name: 'Sinch Engage' } as any;
      },
      helpers,
      async getCredentials(name: string) {
        if (name === 'messageMediaApi') {
          return { apiKey: 'k', apiSecret: 's' };
        }
        return {};
      },
    };
  }

  it('returns sandbox success without HTTP', async () => {
    const { SmsSender } = await import('../src/nodes/SmsSender/SmsSender.node');
    const node = new (SmsSender as any)();

    const fakeThis = buildFakeThis([
      {
        to: '+14155552671',
        fromSelection: 'account',
        fromAccountNumber: '+14155559876',
        message: 'Hi',
        useSandbox: true,
        testMode: false,
        additionalFields: { returnRaw: true },
      },
    ]);

    const result = await (node.execute as any).call(fakeThis);
    const item = result[0][0].json;
    expect(item.status).toBe('queued');
    expect(item.providerMessageId).toMatch(/sandbox_/);
  });

  it('applies rate limiting between items', async () => {
    const { SmsSender } = await import('../src/nodes/SmsSender/SmsSender.node');
    const node = new (SmsSender as any)();

    const scope = nock('https://httpbin.org').post('/post').times(2).reply(200, { ok: true });

    const fakeThis = buildFakeThis([
      {
        to: '+14155552671',
        fromSelection: 'account',
        fromAccountNumber: '+14155559876',
        message: 'Hi',
        useSandbox: false,
        testMode: true,
        additionalFields: { rateLimit: 60 },
      },
      {
        to: '+14155552671',
        fromSelection: 'account',
        fromAccountNumber: '+14155559876',
        message: 'Hi again',
        useSandbox: false,
        testMode: true,
        additionalFields: { rateLimit: 60 },
      },
    ]);

    const start = Date.now();
    const result = await (node.execute as any).call(fakeThis);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(55);
    expect(result[0]).toHaveLength(2);
    expect(scope.isDone()).toBe(true);
  });
});
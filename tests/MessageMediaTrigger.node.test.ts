import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SinchEngageTrigger } from '../src/nodes/SinchEngage/SinchEngageTrigger.node';
import type { IHookFunctions, IWebhookFunctions } from 'n8n-workflow';

describe('SinchEngageTrigger', () => {
  let triggerNode: SinchEngageTrigger;

  beforeEach(() => {
    triggerNode = new SinchEngageTrigger();
  });

  describe('Node Configuration', () => {
    it('should have correct node metadata', () => {
      expect(triggerNode.description.displayName).toBe('Sinch Engage Trigger');
      expect(triggerNode.description.name).toBe('sinchEngageTrigger');
      expect(triggerNode.description.group).toEqual(['trigger']);
      expect(triggerNode.description.inputs).toEqual([]);
      expect(triggerNode.description.outputs).toEqual(['main']);
    });

    it('should require messageMediaApi credentials', () => {
      const credentials = triggerNode.description.credentials;
      expect(credentials).toBeDefined();
      expect(credentials).toHaveLength(1);
      expect(credentials?.[0].name).toBe('messageMediaApi');
      expect(credentials?.[0].required).toBe(true);
    });

    it('should define POST webhook', () => {
      const webhooks = triggerNode.description.webhooks;
      expect(webhooks).toBeDefined();
      expect(webhooks).toHaveLength(1);
      expect(webhooks?.[0].httpMethod).toBe('POST');
      expect(webhooks?.[0].responseMode).toBe('onReceived');
    });
  });

  describe('Webhook Methods', () => {
    describe('checkExists', () => {
      it('should return false when no webhookId is stored', async () => {
        const mockContext = {
          getWorkflowStaticData: vi.fn(() => ({})),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            request: vi.fn(),
          },
        } as unknown as IHookFunctions;

        const exists = await triggerNode.webhookMethods.default.checkExists.call(mockContext);
        expect(exists).toBe(false);
      });

  it('should return true when webhook exists in MessageMedia', async () => {
        const mockWebhookData = { webhookId: 'webhook-123' };
        const mockContext = {
          getWorkflowStaticData: vi.fn(() => mockWebhookData),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            request: vi.fn(async () => ({
              id: 'webhook-123',
              url: 'https://n8n.example.com/webhook/abc',
            })),
          },
        } as unknown as IHookFunctions;

        const exists = await triggerNode.webhookMethods.default.checkExists.call(mockContext);
        expect(exists).toBe(true);
        // Ensure helper was invoked
        expect((mockContext.helpers.request as any).mock.calls.length).toBe(1);
      });

      it('should return false and clear data when webhook does not exist', async () => {
        const mockWebhookData = { webhookId: 'webhook-123', webhookUrl: 'https://example.com' };
        const mockContext = {
          getWorkflowStaticData: vi.fn(() => mockWebhookData),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            request: vi.fn(async () => {
              throw { statusCode: 404, message: 'Not found' };
            }),
          },
        } as unknown as IHookFunctions;

        const exists = await triggerNode.webhookMethods.default.checkExists.call(mockContext);
        expect(exists).toBe(false);
        expect(mockWebhookData.webhookId).toBeUndefined();
        expect(mockWebhookData.webhookUrl).toBeUndefined();
      });
    });

    describe('create', () => {
  it('should create webhook and store ID', async () => {
        const mockWebhookData: Record<string, string> = {};
        const mockContext = {
          getNodeWebhookUrl: vi.fn(() => 'https://n8n.example.com/webhook/abc'),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          getWorkflowStaticData: vi.fn(() => mockWebhookData),
          helpers: {
            request: vi.fn(async () => ({
              id: 'webhook-123',
              url: 'https://n8n.example.com/webhook/abc',
              events: ['RECEIVED_SMS'],
            })),
          },
          getNode: vi.fn(() => ({ name: 'Sinch Engage Trigger' })),
        } as unknown as IHookFunctions;

        const result = await triggerNode.webhookMethods.default.create.call(mockContext);
        expect(result).toBe(true);
        expect(mockWebhookData.webhookId).toBe('webhook-123');
        expect(mockWebhookData.webhookUrl).toBe('https://n8n.example.com/webhook/abc');
        expect((mockContext.helpers.request as any).mock.calls.length).toBe(1);
      });

      it('should throw NodeApiError on creation failure', async () => {
        const mockContext = {
          getNodeWebhookUrl: vi.fn(() => 'https://n8n.example.com/webhook/abc'),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          getWorkflowStaticData: vi.fn(() => ({})),
          helpers: {
            request: vi.fn(async () => {
              throw { statusCode: 401, message: 'Unauthorized' };
            }),
          },
          getNode: vi.fn(() => ({ name: 'Sinch Engage Trigger' })),
        } as unknown as IHookFunctions;

        await expect(
          triggerNode.webhookMethods.default.create.call(mockContext)
        ).rejects.toThrow('Failed to create webhook');
      });
    });

    describe('delete', () => {
  it('should delete webhook and clear static data', async () => {
        const mockWebhookData = { webhookId: 'webhook-123', webhookUrl: 'https://example.com' };
        const mockContext = {
          getWorkflowStaticData: vi.fn(() => mockWebhookData),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            request: vi.fn(async () => ({})),
          },
        } as unknown as IHookFunctions;

        const result = await triggerNode.webhookMethods.default.delete.call(mockContext);
        expect(result).toBe(true);
        expect(mockWebhookData.webhookId).toBeUndefined();
        expect(mockWebhookData.webhookUrl).toBeUndefined();
        expect((mockContext.helpers.request as any).mock.calls.length).toBe(1);
      });

      it('should return true if no webhookId is stored', async () => {
        const mockContext = {
          getWorkflowStaticData: vi.fn(() => ({})),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            request: vi.fn(),
          },
        } as unknown as IHookFunctions;

        const result = await triggerNode.webhookMethods.default.delete.call(mockContext);
        expect(result).toBe(true);
        expect(mockContext.helpers.request).not.toHaveBeenCalled();
      });

      it('should handle 404 errors gracefully', async () => {
        const mockWebhookData = { webhookId: 'webhook-123', webhookUrl: 'https://example.com' };
        const mockContext = {
          getWorkflowStaticData: vi.fn(() => mockWebhookData),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            request: vi.fn(async () => {
              throw { statusCode: 404, message: 'Not found' };
            }),
          },
        } as unknown as IHookFunctions;

        const result = await triggerNode.webhookMethods.default.delete.call(mockContext);
        expect(result).toBe(true);
        expect(mockWebhookData.webhookId).toBeUndefined();
      });
    });
  });

  describe('webhook', () => {
    it('should process incoming SMS webhook correctly', async () => {
      const mockIncomingSms = {
        id: 'msg-12345',
        date_received: '2025-10-17T10:30:00Z',
        destination_number: '+1234567890',
        source_number: '+0987654321',
        message_content: 'Hello from customer',
        metadata: { custom: 'data' },
      };

      const mockContext = {
        getBodyData: vi.fn(() => mockIncomingSms),
      } as unknown as IWebhookFunctions;

      const result = await triggerNode.webhook.call(mockContext);

      expect(result.workflowData).toBeDefined();
      expect(result.workflowData).toHaveLength(1);
      expect(result.workflowData![0]).toHaveLength(1);
      
      const outputData = result.workflowData![0][0].json;
      expect(outputData).toEqual({
        messageId: 'msg-12345',
        from: '+0987654321',
        to: '+1234567890',
        message: 'Hello from customer',
        receivedAt: '2025-10-17T10:30:00Z',
        metadata: { custom: 'data' },
        raw: mockIncomingSms,
      });
    });

    it('should handle incoming SMS without metadata', async () => {
      const mockIncomingSms = {
        id: 'msg-67890',
        date_received: '2025-10-17T11:00:00Z',
        destination_number: '+1111111111',
        source_number: '+2222222222',
        message_content: 'Test message',
      };

      const mockContext = {
        getBodyData: vi.fn(() => mockIncomingSms),
      } as unknown as IWebhookFunctions;

      const result = await triggerNode.webhook.call(mockContext);

      const outputData = result.workflowData![0][0].json;
      expect(outputData.metadata).toEqual({});
      expect(outputData.messageId).toBe('msg-67890');
      expect(outputData.message).toBe('Test message');
    });
  });

  describe('manualTriggerFunction', () => {
    it('should provide sample test data', async () => {
      const mockContext = {
        getCredentials: vi.fn(async () => ({
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        })),
      } as unknown as IHookFunctions;

      const result = await triggerNode.manualTriggerFunction!.call(mockContext);

      expect(result.workflowData).toBeDefined();
      expect(result.workflowData).toHaveLength(1);
      expect(result.workflowData![0]).toHaveLength(1);
      
      const outputData = result.workflowData![0][0].json;
      
      // Verify the structure matches expected format
      expect(outputData).toHaveProperty('messageId');
      expect(outputData).toHaveProperty('from');
      expect(outputData).toHaveProperty('to');
      expect(outputData).toHaveProperty('message');
      expect(outputData).toHaveProperty('receivedAt');
      expect(outputData).toHaveProperty('metadata');
      expect(outputData).toHaveProperty('raw');
      
      // Verify sample data content
      expect(outputData.from).toBe('+61437536808');
      expect(outputData.to).toBe('+1234567890');
      expect(outputData.message).toBe('This is a sample test SMS message from MessageMedia');
      expect(outputData.metadata).toHaveProperty('sample', true);
      expect(outputData.metadata).toHaveProperty('testEvent', 'manual-trigger');
    });

    it('should generate unique message IDs for each call', async () => {
      const mockContext = {
        getCredentials: vi.fn(async () => ({
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        })),
      } as unknown as IHookFunctions;

      const result1 = await triggerNode.manualTriggerFunction!.call(mockContext);
      const result2 = await triggerNode.manualTriggerFunction!.call(mockContext);

      const messageId1 = result1.workflowData![0][0].json.messageId;
      const messageId2 = result2.workflowData![0][0].json.messageId;

      expect(messageId1).not.toBe(messageId2);
      expect(messageId1).toMatch(/^sample-msg-/);
      expect(messageId2).toMatch(/^sample-msg-/);
    });
  });
});


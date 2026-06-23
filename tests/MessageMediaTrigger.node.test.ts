import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('n8n-workflow', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('n8n-workflow');
  class NodeApiError extends Error {
    constructor(_node: unknown, options: { message?: string; description?: string }) {
      super(options.message || 'Unknown error');
    }
  }
  return {
    ...actual,
    NodeApiError,
    NodeConnectionTypes: { Main: 'main' },
  };
});

import { SinchEngageTrigger } from '../nodes/SinchEngage/SinchEngageTrigger.node';
import { NodeConnectionTypes } from 'n8n-workflow';
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
      expect(triggerNode.description.outputs).toEqual([NodeConnectionTypes.Main]);
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

    it('should include contact list trigger event options', () => {
      const eventTypeProperty = triggerNode.description.properties.find((p) => p.name === 'eventType');
      const optionValues = (eventTypeProperty?.options || []).map((o: any) => o.value);

      expect(optionValues).toContain('incomingSms');
      expect(optionValues).toContain('contactAddedToList');
      expect(optionValues).toContain('contactRemovedFromList');
    });
  });

  describe('Webhook Methods', () => {
    describe('checkExists', () => {
      it('should return false when no webhookId is stored', async () => {
        const mockContext = {
          getNodeParameter: vi.fn(() => 'incomingSms'),
          getWorkflowStaticData: vi.fn(() => ({})),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            httpRequestWithAuthentication: vi.fn(),
          },
        } as unknown as IHookFunctions;

        const exists = await triggerNode.webhookMethods.default.checkExists.call(mockContext);
        expect(exists).toBe(false);
      });

  it('should return true when webhook exists in MessageMedia', async () => {
        const mockWebhookData = { webhookId: 'webhook-123', eventType: 'incomingSms' };
        const mockContext = {
          getNodeParameter: vi.fn(() => 'incomingSms'),
          getWorkflowStaticData: vi.fn(() => mockWebhookData),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            httpRequestWithAuthentication: vi.fn(async () => ({
              id: 'webhook-123',
              url: 'https://n8n.example.com/webhook/abc',
            })),
          },
        } as unknown as IHookFunctions;

        const exists = await triggerNode.webhookMethods.default.checkExists.call(mockContext);
        expect(exists).toBe(true);
        // Ensure helper was invoked
        expect((mockContext.helpers.httpRequestWithAuthentication as any).mock.calls.length).toBe(1);
      });

      it('should return false and clear data when webhook does not exist', async () => {
        const mockWebhookData = { webhookId: 'webhook-123', webhookUrl: 'https://example.com', eventType: 'incomingSms' };
        const mockContext = {
          getNodeParameter: vi.fn(() => 'incomingSms'),
          getWorkflowStaticData: vi.fn(() => mockWebhookData),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            httpRequestWithAuthentication: vi.fn(async () => {
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
          getNodeParameter: vi.fn(() => 'incomingSms'),
          getNodeWebhookUrl: vi.fn(() => 'https://n8n.example.com/webhook/abc'),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          getWorkflowStaticData: vi.fn(() => mockWebhookData),
          helpers: {
            httpRequestWithAuthentication: vi.fn(async () => ({
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
        expect(mockWebhookData.webhookType).toBe('messages');
        expect((mockContext.helpers.httpRequestWithAuthentication as any).mock.calls.length).toBe(1);
      });

      it('should create contact list webhook on connectors endpoint', async () => {
        const mockWebhookData: Record<string, string> = {};
        const mockContext = {
          getNodeParameter: vi.fn(() => 'contactAddedToList'),
          getNodeWebhookUrl: vi.fn(() => 'https://n8n.example.com/webhook/abc'),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          getWorkflowStaticData: vi.fn(() => mockWebhookData),
          helpers: {
            httpRequestWithAuthentication: vi.fn(async () => ({
              id: 'webhook-456',
              url: 'https://n8n.example.com/webhook/abc',
              events: ['CONTACT_LIST_ADDED'],
            })),
          },
          getNode: vi.fn(() => ({ name: 'Sinch Engage Trigger' })),
        } as unknown as IHookFunctions;

        const result = await triggerNode.webhookMethods.default.create.call(mockContext);
        expect(result).toBe(true);
        expect(mockWebhookData.webhookType).toBe('connectors');

        const requestCall = (mockContext.helpers.httpRequestWithAuthentication as any).mock.calls[0]?.[1];
        expect(requestCall.url).toBe('https://api.messagemedia.com/v1/connectors/webhooks');
        expect(requestCall.body.events).toEqual(['CONTACT_LIST_ADDED']);
      });

      it('should throw NodeApiError on creation failure', async () => {
        const mockContext = {
          getNodeParameter: vi.fn(() => 'incomingSms'),
          getNodeWebhookUrl: vi.fn(() => 'https://n8n.example.com/webhook/abc'),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          getWorkflowStaticData: vi.fn(() => ({})),
          helpers: {
            httpRequestWithAuthentication: vi.fn(async () => {
              throw { statusCode: 401, message: 'Unauthorized' };
            }),
          },
          getNode: vi.fn(() => ({ name: 'Sinch Engage Trigger' })),
        } as unknown as IHookFunctions;

        await expect(
          triggerNode.webhookMethods.default.create.call(mockContext)
        ).rejects.toThrow('Unable to register webhook with Sinch Engage');
      });
    });

    describe('delete', () => {
  it('should delete webhook and clear static data', async () => {
        const mockWebhookData = { webhookId: 'webhook-123', webhookUrl: 'https://example.com', webhookType: 'messages' };
        const mockContext = {
          getWorkflowStaticData: vi.fn(() => mockWebhookData),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            httpRequestWithAuthentication: vi.fn(async () => ({})),
          },
        } as unknown as IHookFunctions;

        const result = await triggerNode.webhookMethods.default.delete.call(mockContext);
        expect(result).toBe(true);
        expect(mockWebhookData.webhookId).toBeUndefined();
        expect(mockWebhookData.webhookUrl).toBeUndefined();
        expect(mockWebhookData.webhookType).toBeUndefined();
        expect((mockContext.helpers.httpRequestWithAuthentication as any).mock.calls.length).toBe(1);
      });

      it('should delete connector webhooks using connectors endpoint', async () => {
        const mockWebhookData = { webhookId: 'webhook-789', webhookType: 'connectors' };
        const mockContext = {
          getWorkflowStaticData: vi.fn(() => mockWebhookData),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            httpRequestWithAuthentication: vi.fn(async () => ({})),
          },
        } as unknown as IHookFunctions;

        const result = await triggerNode.webhookMethods.default.delete.call(mockContext);
        expect(result).toBe(true);

        const requestCall = (mockContext.helpers.httpRequestWithAuthentication as any).mock.calls[0]?.[1];
        expect(requestCall.url).toBe('https://api.messagemedia.com/v1/connectors/webhooks/webhook-789');
      });

      it('should return true if no webhookId is stored', async () => {
        const mockContext = {
          getWorkflowStaticData: vi.fn(() => ({})),
          getCredentials: vi.fn(async () => ({
            apiKey: 'test-key',
            apiSecret: 'test-secret',
          })),
          helpers: {
            httpRequestWithAuthentication: vi.fn(),
          },
        } as unknown as IHookFunctions;

        const result = await triggerNode.webhookMethods.default.delete.call(mockContext);
        expect(result).toBe(true);
        expect(mockContext.helpers.httpRequestWithAuthentication).not.toHaveBeenCalled();
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
            httpRequestWithAuthentication: vi.fn(async () => {
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
        getNodeParameter: vi.fn(() => 'incomingSms'),
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
        getNodeParameter: vi.fn(() => 'incomingSms'),
        getBodyData: vi.fn(() => mockIncomingSms),
      } as unknown as IWebhookFunctions;

      const result = await triggerNode.webhook.call(mockContext);

      const outputData = result.workflowData![0][0].json;
      expect(outputData.metadata).toEqual({});
      expect(outputData.messageId).toBe('msg-67890');
      expect(outputData.message).toBe('Test message');
    });

    it('should process contact list added webhook correctly', async () => {
      const mockContactEvent = {
        eventId: 'evt-001',
        eventType: 'CONTACT_LIST_ADDED',
        eventDeliveryId: 'del-001',
        vendorId: 'vendor-1',
        accountId: 'account-1',
        contactId: 'contact-123',
        firstName: 'Jane',
        lastName: 'Doe',
        phoneNumber: '+61437536808',
        email: 'jane.doe@example.com',
        listId: 'list-123',
        listName: 'VIP Customers',
        receivedTimestamp: '2026-06-02T06:00:00Z',
      };

      const mockContext = {
        getNodeParameter: vi.fn(() => 'contactAddedToList'),
        getBodyData: vi.fn(() => mockContactEvent),
      } as unknown as IWebhookFunctions;

      const result = await triggerNode.webhook.call(mockContext);
      const outputData = result.workflowData![0][0].json;

      expect(outputData).toEqual({
        eventType: 'CONTACT_LIST_ADDED',
        contactId: 'contact-123',
        listId: 'list-123',
        listName: 'VIP Customers',
        receivedTimestamp: '2026-06-02T06:00:00Z',
      });
    });

    it('should process contact list removed webhook correctly', async () => {
      const mockContactEvent = {
        eventType: 'CONTACT_LIST_REMOVED',
        contactId: 'contact-456',
        listId: 'list-456',
        listName: 'Newsletter',
        receivedTimestamp: '2026-06-02T07:00:00Z',
      };

      const mockContext = {
        getNodeParameter: vi.fn(() => 'contactRemovedFromList'),
        getBodyData: vi.fn(() => mockContactEvent),
      } as unknown as IWebhookFunctions;

      const result = await triggerNode.webhook.call(mockContext);
      const outputData = result.workflowData![0][0].json;

      expect(outputData).toEqual({
        eventType: 'CONTACT_LIST_REMOVED',
        contactId: 'contact-456',
        listId: 'list-456',
        listName: 'Newsletter',
        receivedTimestamp: '2026-06-02T07:00:00Z',
      });
    });

    it('should use fallback eventType when not present in payload', async () => {
      const mockContactEvent = {
        contactId: 'contact-789',
        listId: 'list-789',
        listName: 'Fallback List',
        receivedTimestamp: '2026-06-02T08:00:00Z',
      };

      const mockContext = {
        getNodeParameter: vi.fn(() => 'contactAddedToList'),
        getBodyData: vi.fn(() => mockContactEvent),
      } as unknown as IWebhookFunctions;

      const result = await triggerNode.webhook.call(mockContext);
      const outputData = result.workflowData![0][0].json;

      expect(outputData.eventType).toBe('CONTACT_LIST_ADDED');
    });
  });

  describe('manualTriggerFunction', () => {
    it('should provide sample contact list added test data', async () => {
      const mockContext = {
        getNodeParameter: vi.fn(() => 'contactAddedToList'),
        getCredentials: vi.fn(async () => ({
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        })),
      } as unknown as IHookFunctions;

      const result = await triggerNode.manualTriggerFunction!.call(mockContext);
      const outputData = result.workflowData![0][0].json;

      expect(Object.keys(outputData)).toEqual(['eventType', 'contactId', 'listId', 'listName', 'receivedTimestamp']);
      expect(outputData.eventType).toBe('CONTACT_LIST_ADDED');
      expect(outputData.contactId).toBe('sample-contact-id');
      expect(outputData.listId).toBe('sample-list-id');
      expect(outputData.listName).toBe('Sample List');
    });

    it('should provide sample contact list removed test data', async () => {
      const mockContext = {
        getNodeParameter: vi.fn(() => 'contactRemovedFromList'),
        getCredentials: vi.fn(async () => ({
          apiKey: 'test-key',
          apiSecret: 'test-secret',
        })),
      } as unknown as IHookFunctions;

      const result = await triggerNode.manualTriggerFunction!.call(mockContext);
      const outputData = result.workflowData![0][0].json;

      expect(Object.keys(outputData)).toEqual(['eventType', 'contactId', 'listId', 'listName', 'receivedTimestamp']);
      expect(outputData.eventType).toBe('CONTACT_LIST_REMOVED');
    });

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


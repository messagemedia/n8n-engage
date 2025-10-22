import type {
  IHookFunctions,
  IWebhookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
  NodeConnectionType,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { makeMessageMediaRequest } from '../../utils/messageMediaHttp';

interface WebhookData {
  webhookId?: string;
  webhookUrl?: string;
}

interface MessageMediaWebhookResponse {
  id: string;
  url: string;
  events: string[];
}

interface IncomingSmsPayload {
  id: string;
  date_received: string;
  destination_number: string;
  source_number: string;
  message_content: string;
  metadata?: Record<string, unknown>;
}

// NOTE: Removed native https helper. All outbound calls must use this.helpers.httpRequest

export class SinchEngageTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sinch Engage Trigger',
    name: 'sinchEngageTrigger',
    icon: 'file:sinch-logo.png',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["eventType"]}}',
    description: 'Receive SMS messages via Sinch Engage webhook',
    defaults: {
      name: 'Sinch Engage',
    },
    inputs: [],
    outputs: ['main' as NodeConnectionType],
    credentials: [
      {
        name: 'messageMediaApi',
        required: true,
      },
    ],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Event Type',
        name: 'eventType',
        type: 'options',
        options: [
          {
            name: 'Incoming SMS',
            value: 'incomingSms',
            description: 'Triggers when an SMS is received',
          },
        ],
        default: 'incomingSms',
        description: 'The type of event that triggers the workflow',
      },
    ],
  };

  webhookMethods = {
    default: {
      async checkExists(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node') as WebhookData;
        const webhookId = webhookData.webhookId;

        if (!webhookId) {
          (this as any).logger?.debug?.('SinchEngageTrigger.checkExists: No webhook ID stored');
          return false;
        }

        const checkUrl = `https://api.messagemedia.com/v1/webhooks/messages/${webhookId}`;

  (this as any).logger?.info?.('SinchEngageTrigger: Checking if webhook exists', {
          webhookId,
          checkUrl,
        });

        try {
          // Check if webhook still exists using stored ID
          const response = await makeMessageMediaRequest(this, {
            method: 'GET',
            url: checkUrl,
          });

          (this as any).logger?.info?.('SinchEngageTrigger: Webhook exists', { webhookId, response });
          return true;
        } catch (error) {
          const err = error as { statusCode?: number; message?: string };
          (this as any).logger?.warn?.('SinchEngageTrigger: Webhook does not exist or error checking', {
            statusCode: err.statusCode,
            message: err.message,
            webhookId,
          });

          // Webhook doesn't exist or API error - clean up stale data
          delete webhookData.webhookId;
          delete webhookData.webhookUrl;
          return false;
        }
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const webhookUrl = this.getNodeWebhookUrl('default');
        const webhookData = this.getWorkflowStaticData('node') as WebhookData;
        const requestUrl = 'https://api.messagemedia.com/v1/webhooks/messages';
        const requestBody = {
          url: webhookUrl,
          method: 'POST',
          encoding: 'JSON',
          events: ['RECEIVED_SMS'],
        };

        try {
          const response = await makeMessageMediaRequest<MessageMediaWebhookResponse>(this, {
            method: 'POST',
            url: requestUrl,
            body: requestBody,
          });

          (this as any).logger?.info?.('✅ SinchEngageTrigger: Webhook created successfully', {
            webhookId: response.id,
            registeredUrl: response.url,
            events: response.events,
          });

          webhookData.webhookId = response.id;
          webhookData.webhookUrl = webhookUrl;
          return true;
        } catch (error: any) {
          (this as any).logger?.error?.('💥 SinchEngageTrigger: Webhook creation failed via httpRequest', {
            message: error.message,
            stack: error.stack?.substring(0, 200),
          });

          throw new NodeApiError(this.getNode(), {
            message: 'Failed to create webhook',
            description: error.message,
          });
        }
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node') as WebhookData;
        const webhookId = webhookData.webhookId;

        if (!webhookId) {
          (this as any).logger?.debug?.('SinchEngageTrigger.delete: No webhook ID to delete');
          return true; // Nothing to delete
        }

  const deleteUrl = `https://api.messagemedia.com/v1/webhooks/messages/${webhookId}`;

  (this as any).logger?.info?.('SinchEngageTrigger: Deleting webhook', {
          webhookId,
          deleteUrl,
        });

        try {
          // Delete webhook from MessageMedia using standardized helper
          await makeMessageMediaRequest(this, {
            method: 'DELETE',
            url: deleteUrl,
          });

          (this as any).logger?.info?.('SinchEngageTrigger: Webhook deleted successfully', { webhookId });

          // Clean up static data
          delete webhookData.webhookId;
          delete webhookData.webhookUrl;

          return true;
        } catch (error: unknown) {
          // Log error but don't fail - webhook might already be deleted
          const err = error as { statusCode?: number; message?: string };
          
          (this as any).logger?.warn?.('SinchEngageTrigger: Error deleting webhook', {
            statusCode: err.statusCode,
            message: err.message,
            webhookId,
          });
          
          // If 404, webhook already deleted
          if (err.statusCode === 404) {
            (this as any).logger?.info?.('SinchEngageTrigger: Webhook already deleted (404), cleaning up');
            delete webhookData.webhookId;
            delete webhookData.webhookUrl;
            return true;
          }

          // For other errors, still clean up local data
          (this as any).logger?.info?.('SinchEngageTrigger: Cleaning up webhook data despite error');
          delete webhookData.webhookId;
          delete webhookData.webhookUrl;
          
          return false;
        }
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const bodyData = this.getBodyData() as unknown as IncomingSmsPayload;

    // MessageMedia sends incoming SMS in this format:
    // {
    //   "id": "msg-id",
    //   "date_received": "ISO-8601",
    //   "destination_number": "+1234567890",
    //   "source_number": "+0987654321",
    //   "message_content": "SMS text",
    //   "metadata": {}
    // }

    // Format data for n8n workflow
    const returnData = {
      messageId: bodyData.id,
      from: bodyData.source_number,
      to: bodyData.destination_number,
      message: bodyData.message_content,
      receivedAt: bodyData.date_received,
      metadata: bodyData.metadata || {},
      raw: bodyData, // Include raw payload for advanced use cases
    };

    return {
      workflowData: [
        [
          {
            json: returnData,
          },
        ],
      ],
    };
  }

  /**
   * Provides sample test event data for manual testing
   * This is called when user clicks "Listen for test event" or "Fetch test event"
   */
  async manualTriggerFunction(this: IHookFunctions): Promise<IWebhookResponseData> {
    // Sample incoming SMS payload that mimics what MessageMedia would send
    const samplePayload: IncomingSmsPayload = {
      id: 'sample-msg-' + Math.random().toString(36).substring(7),
      date_received: new Date().toISOString(),
      destination_number: '+1234567890',
      source_number: '+61437536808',
      message_content: 'This is a sample test SMS message from MessageMedia',
      metadata: {
        sample: true,
        testEvent: 'manual-trigger',
      },
    };

    // Format the same way as the real webhook
    const returnData = {
      messageId: samplePayload.id,
      from: samplePayload.source_number,
      to: samplePayload.destination_number,
      message: samplePayload.message_content,
      receivedAt: samplePayload.date_received,
      metadata: samplePayload.metadata || {},
      raw: samplePayload,
    };

    return {
      workflowData: [
        [
          {
            json: returnData,
          },
        ],
      ],
    };
  }
}

import type {
  IHookFunctions,
  IWebhookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
  NodeConnectionType,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

interface MessageMediaCredentials {
  apiKey: string;
  apiSecret: string;
}

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

export class SmsSenderTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sinch Engage',
    name: 'smsSenderTrigger',
    icon: 'file:sinch-logo.png',
    group: ['trigger'],
    version: 1,
    description: 'Triggers workflow when SMS is received via Sinch Engage',
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
          return false;
        }

        const credentials = (await this.getCredentials('messageMediaApi')) as MessageMediaCredentials;

        try {
          // Check if webhook still exists using stored ID
          await this.helpers.request({
            method: 'GET',
            uri: `https://api.messagemedia.com/v1/webhooks/${webhookId}`,
            auth: {
              user: credentials.apiKey,
              pass: credentials.apiSecret,
            },
            json: true,
          });

          return true;
        } catch (error) {
          // Webhook doesn't exist or API error
          delete webhookData.webhookId;
          delete webhookData.webhookUrl;
          return false;
        }
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const webhookUrl = this.getNodeWebhookUrl('default');
        const credentials = (await this.getCredentials('messageMediaApi')) as MessageMediaCredentials;
        const webhookData = this.getWorkflowStaticData('node') as WebhookData;

        try {
          // Register webhook with MessageMedia for incoming SMS
          const response = (await this.helpers.request({
            method: 'POST',
            uri: 'https://api.messagemedia.com/v1/webhooks',
            auth: {
              user: credentials.apiKey,
              pass: credentials.apiSecret,
            },
            body: {
              url: webhookUrl,
              events: ['RECEIVED_SMS'],
            },
            json: true,
          })) as MessageMediaWebhookResponse;

          // Store webhook ID for later deletion
          webhookData.webhookId = response.id;
          webhookData.webhookUrl = webhookUrl;

          return true;
        } catch (error: unknown) {
          const err = error as { statusCode?: number; message?: string; error?: unknown };
          throw new NodeApiError(this.getNode(), {
            message: `Failed to create webhook: ${err.message || 'Unknown error'}`,
            description: `Status: ${err.statusCode || 'unknown'}`,
          });
        }
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node') as WebhookData;
        const webhookId = webhookData.webhookId;

        if (!webhookId) {
          return true; // Nothing to delete
        }

        const credentials = (await this.getCredentials('messageMediaApi')) as MessageMediaCredentials;

        try {
          // Delete webhook from MessageMedia
          await this.helpers.request({
            method: 'DELETE',
            uri: `https://api.messagemedia.com/v1/webhooks/${webhookId}`,
            auth: {
              user: credentials.apiKey,
              pass: credentials.apiSecret,
            },
            json: true,
          });

          // Clean up static data
          delete webhookData.webhookId;
          delete webhookData.webhookUrl;

          return true;
        } catch (error: unknown) {
          // Log error but don't fail - webhook might already be deleted
          const err = error as { statusCode?: number; message?: string };
          
          // If 404, webhook already deleted
          if (err.statusCode === 404) {
            delete webhookData.webhookId;
            delete webhookData.webhookUrl;
            return true;
          }

          // For other errors, still clean up local data
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
}

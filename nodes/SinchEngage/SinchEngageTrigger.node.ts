import type {
  IHookFunctions,
  IWebhookFunctions,
  INodeType,
  INodeTypeDescription,
  IWebhookResponseData,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes } from 'n8n-workflow';
import { makeMessageMediaRequest } from '../../utils/messageMediaHttp';

interface WebhookData {
  webhookId?: string;
  webhookUrl?: string;
  webhookType?: 'messages' | 'connectors';
  eventType?: TriggerEventType;
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

interface ContactListPayload {
  eventType?: string;
  contactId?: string;
  listId?: string;
  listName?: string;
  receivedTimestamp?: string;
}

type TriggerEventType = 'incomingSms' | 'contactAddedToList' | 'contactRemovedFromList';

function getWebhookConfig(eventType: TriggerEventType): {
  baseUrl: string;
  events: string[];
  webhookType: 'messages' | 'connectors';
  template?: string;
} {
  if (eventType === 'contactAddedToList') {
    return {
      baseUrl: 'https://api.messagemedia.com/v1/connectors/webhooks',
      events: ['CONTACT_LIST_ADDED'],
      webhookType: 'connectors',
      template: '{"eventType":"$eventType","contactId":"$contactId","listId":"$listId","listName":"$esc.json($listName)","receivedTimestamp":"$receivedTimestamp"}',
    };
  }

  if (eventType === 'contactRemovedFromList') {
    return {
      baseUrl: 'https://api.messagemedia.com/v1/connectors/webhooks',
      events: ['CONTACT_LIST_REMOVED'],
      webhookType: 'connectors',
      template: '{"eventType":"$eventType","contactId":"$contactId","listId":"$listId","listName":"$esc.json($listName)","receivedTimestamp":"$receivedTimestamp"}',
    };
  }

  return {
    baseUrl: 'https://api.messagemedia.com/v1/webhooks/messages',
    events: ['RECEIVED_SMS', 'RECEIVED_MMS'],
    webhookType: 'messages',
    template: '{"id": "$!moId","date_received": "$receivedTimestamp","destination_number": "$!destinationAddress","source_number": "$!sourceAddress","message_content": "$esc.json($replyContent)","metadata":{#foreach($key in $metadata.keySet())"$key" : "$esc.json($metadata.get($key))"#if( $velocityHasNext ), #end#end}}',
  };
}

// NOTE: Removed native https helper. All outbound calls must use this.helpers.httpRequest

export class SinchEngageTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sinch Engage Trigger',
    name: 'sinchEngageTrigger',
    icon: 'file:sinch-logo.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["eventType"]}}',
    description: 'Receive Sinch Engage events via webhook',
    defaults: {
      name: 'Sinch Engage Trigger',
    },
    inputs: [],
    // eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
    outputs: [NodeConnectionTypes.Main],
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
          {
            name: 'Contact Added To List',
            value: 'contactAddedToList',
            description: 'Triggers when a contact is added to a list',
          },
          {
            name: 'Contact Removed From List',
            value: 'contactRemovedFromList',
            description: 'Triggers when a contact is removed from a list',
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
        const currentEventType = this.getNodeParameter('eventType', 'incomingSms') as TriggerEventType;

        if (!webhookId) {
          return false;
        }

        // If the event type has changed, we need to recreate the webhook
        if (webhookData.eventType && webhookData.eventType !== currentEventType) {
          // Delete the old webhook from MessageMedia before clearing local data
          const webhookType = webhookData.webhookType || 'messages';
          const deleteUrl = webhookType === 'connectors'
            ? `https://api.messagemedia.com/v1/connectors/webhooks/${webhookId}`
            : `https://api.messagemedia.com/v1/webhooks/messages/${webhookId}`;

          try {
            await makeMessageMediaRequest(this, {
              method: 'DELETE',
              url: deleteUrl,
            });
          } catch (error) {
            // If delete fails (e.g., 404), proceed anyway - the create method will register a new webhook
          }

          // Clean up stale data - the create method will register a new webhook
          delete webhookData.webhookId;
          delete webhookData.webhookUrl;
          delete webhookData.webhookType;
          delete webhookData.eventType;
          return false;
        }

        const webhookType = webhookData.webhookType || 'messages';
        const checkUrl = webhookType === 'connectors'
          ? `https://api.messagemedia.com/v1/connectors/webhooks/${webhookId}`
          : `https://api.messagemedia.com/v1/webhooks/messages/${webhookId}`;

        try {
          // Check if webhook still exists using stored ID
          await makeMessageMediaRequest(this, {
            method: 'GET',
            url: checkUrl,
          });

          return true;
        } catch (error) {
          // Webhook doesn't exist or API error - clean up stale data
          delete webhookData.webhookId;
          delete webhookData.webhookUrl;
          delete webhookData.webhookType;
          delete webhookData.eventType;
          return false;
        }
      },

      async create(this: IHookFunctions): Promise<boolean> {
        const eventType = this.getNodeParameter('eventType', 'incomingSms') as TriggerEventType;
        const webhookUrl = this.getNodeWebhookUrl('default');
        const webhookData = this.getWorkflowStaticData('node') as WebhookData;
        const config = getWebhookConfig(eventType);

        const requestBody = {
          url: webhookUrl,
          method: 'POST',
          encoding: 'JSON',
          headers: { "Source": "n8n" },
          events: config.events,
          template: config.template,
        };

        try {
          const response = await makeMessageMediaRequest<MessageMediaWebhookResponse>(this, {
            method: 'POST',
            url: config.baseUrl,
            body: requestBody,
          });

          webhookData.webhookId = response.id;
          webhookData.webhookUrl = webhookUrl;
          webhookData.webhookType = config.webhookType;
          webhookData.eventType = eventType;
          return true;
        } catch (error: unknown) {
          const err = error as { message?: string };
          throw new NodeApiError(this.getNode(), {
            message: 'Unable to register webhook with Sinch Engage',
            description: 'Check your API credentials and ensure webhooks are enabled on your Sinch Engage account. Error: ' + (err.message || 'Unknown error'),
          });
        }
      },

      async delete(this: IHookFunctions): Promise<boolean> {
        const webhookData = this.getWorkflowStaticData('node') as WebhookData;
        const webhookId = webhookData.webhookId;

        if (!webhookId) {
          return true; // Nothing to delete
        }

        const webhookType = webhookData.webhookType || 'messages';
        const deleteUrl = webhookType === 'connectors'
          ? `https://api.messagemedia.com/v1/connectors/webhooks/${webhookId}`
          : `https://api.messagemedia.com/v1/webhooks/messages/${webhookId}`;

        try {
          // Delete webhook from MessageMedia using standardized helper
          await makeMessageMediaRequest(this, {
            method: 'DELETE',
            url: deleteUrl,
          });

          // Clean up static data
          delete webhookData.webhookId;
          delete webhookData.webhookUrl;
          delete webhookData.webhookType;
          delete webhookData.eventType;

          return true;
        } catch (error: unknown) {
          const err = error as { statusCode?: number; message?: string };

          // If 404, webhook already deleted
          if (err.statusCode === 404) {
            delete webhookData.webhookId;
            delete webhookData.webhookUrl;
            delete webhookData.webhookType;
            delete webhookData.eventType;
            return true;
          }

          // For other errors, still clean up local data
          delete webhookData.webhookId;
          delete webhookData.webhookUrl;
          delete webhookData.webhookType;
          delete webhookData.eventType;

          return false;
        }
      },
    },
  };

  async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
    const bodyData = this.getBodyData() as unknown;
    const eventType = this.getNodeParameter('eventType', 'incomingSms') as TriggerEventType;

    if (eventType === 'contactAddedToList' || eventType === 'contactRemovedFromList') {
      const contactPayload = bodyData as ContactListPayload;
      const fallbackEventType = eventType === 'contactAddedToList' ? 'CONTACT_LIST_ADDED' : 'CONTACT_LIST_REMOVED';

      const returnData = {
        eventType: contactPayload.eventType || fallbackEventType,
        contactId: contactPayload.contactId || null,
        listId: contactPayload.listId || null,
        listName: contactPayload.listName || null,
        receivedTimestamp: contactPayload.receivedTimestamp || null,
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

    const smsPayload = bodyData as IncomingSmsPayload;

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
      messageId: smsPayload.id,
      from: smsPayload.source_number,
      to: smsPayload.destination_number,
      message: smsPayload.message_content,
      receivedAt: smsPayload.date_received,
      metadata: smsPayload.metadata || {},
      raw: smsPayload, // Include raw payload for advanced use cases
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
    const eventType = (typeof this.getNodeParameter === 'function'
      ? this.getNodeParameter('eventType', 'incomingSms')
      : 'incomingSms') as TriggerEventType;

    if (eventType === 'contactAddedToList' || eventType === 'contactRemovedFromList') {
      const sampleEventType = eventType === 'contactAddedToList' ? 'CONTACT_LIST_ADDED' : 'CONTACT_LIST_REMOVED';

      const samplePayload: ContactListPayload = {
        eventType: sampleEventType,
        contactId: 'sample-contact-id',
        listId: 'sample-list-id',
        listName: 'Sample List',
        receivedTimestamp: new Date().toISOString(),
      };

      return {
        workflowData: [
          [
            {
              json: {
                eventType: samplePayload.eventType,
                contactId: samplePayload.contactId,
                listId: samplePayload.listId,
                listName: samplePayload.listName,
                receivedTimestamp: samplePayload.receivedTimestamp,
              },
            },
          ],
        ],
      };
    }

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

import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeConnectionType,
  IDataObject,
  ILoadOptionsFunctions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';
import { normalizePhoneNumberToE164, detectEncoding } from '../../utils/phone';
import type { SmsOutputItem, EncodingOption, ProviderName } from './types';
import type { ProviderStrategy } from './providers/ProviderStrategy';
import { MessageMediaProvider } from './providers/MessageMediaProvider';

export class SmsSender implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MessageMedia SMS Sender',
    name: 'smsSender',
    group: ['transform'],
    version: 1,
    description: 'Send SMS via MessageMedia',
    defaults: {
      name: 'MessageMedia SMS Sender',
    },
    inputs: ['main' as NodeConnectionType],
    outputs: ['main' as NodeConnectionType],
    credentials: [
      { name: 'messageMediaApi', required: true },
    ],
    properties: [
      // 2. MESSAGE DETAILS
      {
        displayName: 'To',
        name: 'to',
        type: 'string',
        required: true,
        default: '',
        description: 'Destination phone number (E.164 preferred)',
      },
      {
        displayName: 'From (Account Numbers)',
        name: 'fromSelection',
        type: 'options',
        options: [
          {
            name: 'Use Account Number',
            value: 'account',
            description: 'Select from available account phone numbers',
          },
          {
            name: 'Custom Number',
            value: 'custom',
            description: 'Enter a custom sender phone number',
          },
        ],
        default: 'account',
        description: 'Choose how to set the sender phone number',
      },
      {
        displayName: 'Account Phone Number',
        name: 'fromAccountNumber',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getAccountNumbers',
        },
        default: '',
        description: 'Select from available account phone numbers',
        displayOptions: {
          show: {
            fromSelection: ['account'],
          },
        },
      },
      {
        displayName: 'From (Custom)',
        name: 'fromCustom',
        type: 'string',
        required: false,
        default: '',
        description: 'Custom sender phone number (E.164 format)',
        displayOptions: {
          show: {
            fromSelection: ['custom'],
          },
        },
      },
      {
        displayName: 'Message',
        name: 'message',
        type: 'string',
        typeOptions: { rows: 3 },
        required: true,
        default: '',
        description: 'Message to send, up to 1600 characters',
      },
      
      // 2. OPERATION MODES
      {
        displayName: 'Use Sandbox (Dry Run)',
        name: 'useSandbox',
        type: 'boolean',
        default: false,
        description: 'Validate but do not send; return simulated success',
      },
      {
        displayName: 'Test Mode (Stub URL)',
        name: 'testMode',
        type: 'boolean',
        default: false,
        description: 'Redirect to httpbin.org for testing (no real SMS sent)',
      },
      
      // 3. ADDITIONAL FIELDS
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        options: [
          {
            displayName: 'Status Callback URL',
            name: 'statusCallbackUrl',
            type: 'string',
            default: '',
            description: 'Webhook URL for delivery status updates',
          },
          {
            displayName: 'Encoding',
            name: 'encoding',
            type: 'options',
            options: [
              { name: 'Auto-detect', value: 'auto' },
              { name: 'GSM7', value: 'GSM7' },
              { name: 'UCS-2', value: 'UCS-2' },
            ],
            default: 'auto',
            description: 'Character encoding for the message',
          },
          {
            displayName: 'Rate Limit (ms)',
            name: 'rateLimit',
            type: 'number',
            default: 1000,
            description: 'Delay between messages in milliseconds',
          },
          {
            displayName: 'Fail if Undeliverable',
            name: 'failIfUndeliverable',
            type: 'boolean',
            default: true,
            description: 'Throw error if message validation fails',
          },
          {
            displayName: 'Return Raw',
            name: 'returnRaw',
            type: 'boolean',
            default: false,
            description: 'Include provider response in output',
          },
        ],
      },
    ],
  };

  methods = {
    loadOptions: {
      async getAccountNumbers(this: ILoadOptionsFunctions) {
        try {
          const credentials = await this.getCredentials('messageMediaApi') as { apiKey: string; apiSecret: string };
          if (!credentials || !credentials.apiKey || !credentials.apiSecret) {
            console.log('No credentials available for MessageMedia API');
            return [];
          }

          console.log('Fetching account numbers from MessageMedia API...');
          
          // Fetch account numbers from MessageMedia API using the correct endpoint
          const response = await this.helpers.request({
            method: 'GET',
            uri: 'https://api.messagemedia.com/v1/messaging/numbers/sender_address/addresses',
            auth: { user: credentials.apiKey, pass: credentials.apiSecret },
            headers: { 'Content-Type': 'application/json' },
            json: true,
          });

          console.log('MessageMedia API response:', JSON.stringify(response, null, 2));

          // Handle different possible response structures
          let numbers = [];
          
          if (response && typeof response === 'object') {
            // Try different possible response structures
            if (Array.isArray(response)) {
              numbers = response;
            } else if (response.addresses && Array.isArray(response.addresses)) {
              numbers = response.addresses;
            } else if (response.numbers && Array.isArray(response.numbers)) {
              numbers = response.numbers;
            } else if (response.data && Array.isArray(response.data)) {
              numbers = response.data;
            } else if (response.content && Array.isArray(response.content)) {
              numbers = response.content;
            } else if (response.items && Array.isArray(response.items)) {
              numbers = response.items;
            } else {
              // If response is an object but no array found, try to extract any array
              const keys = Object.keys(response);
              for (const key of keys) {
                if (Array.isArray(response[key])) {
                  numbers = response[key];
                  console.log(`Found array in response.${key}:`, numbers);
                  break;
                }
              }
            }
          }

          console.log('Extracted numbers array:', numbers);
          console.log('Numbers array length:', numbers.length);

          if (numbers.length === 0) {
            console.log('No numbers found in response. Response keys:', response ? Object.keys(response) : 'No response');
            
            // Return a helpful message option
            return [
              {
                name: 'No additional sender addresses found - using default account number',
                value: 'use_default',
              }
            ];
          }

          // Map the numbers to the expected format
          const options = numbers.map((num: any, index: number) => {
            // Try different possible property names for the phone number
            const phoneNumber = num.address || num.number || num.phoneNumber || num.phone || num.id || `Number ${index + 1}`;
            const type = num.type || num.numberType || num.category || 'SMS';
            
            return {
              name: `${phoneNumber} (${type})`,
              value: phoneNumber,
            };
          });

          console.log('Generated options:', options);
          return options;
          
        } catch (error) {
          console.error('Error fetching account numbers from MessageMedia API:', error);
          return [];
        }
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const toRaw = this.getNodeParameter('to', itemIndex) as string;
      const fromSelection = this.getNodeParameter('fromSelection', itemIndex) as string;
      const fromAccountNumber = this.getNodeParameter('fromAccountNumber', itemIndex) as string | number;
      
      // Get the appropriate "From" field based on provider
      let fromRaw: string;
      if (fromSelection === 'account') {
        if (!fromAccountNumber || fromAccountNumber === 'use_default') {
          // Use default account number (empty string means use default)
          fromRaw = '';
        } else {
          fromRaw = String(fromAccountNumber);
        }
      } else {
        // Safely get the fromCustom parameter
        const fromCustomValue = this.getNodeParameter('fromCustom', itemIndex, '') as string;
        if (!fromCustomValue || fromCustomValue.trim() === '') {
          throw new NodeApiError(this.getNode(), { message: 'Custom sender phone number is required when using "Custom Number" option.' });
        }
        fromRaw = fromCustomValue;
      }
      
      const message = this.getNodeParameter('message', itemIndex) as string;
      const useSandbox = this.getNodeParameter('useSandbox', itemIndex, false) as boolean;
      const testMode = this.getNodeParameter('testMode', itemIndex, false) as boolean;

      const additional = this.getNodeParameter('additionalFields', itemIndex, {}) as {
        statusCallbackUrl?: string;
        encoding?: EncodingOption;
        rateLimit?: number;
        failIfUndeliverable?: boolean;
        returnRaw?: boolean;
      };

      const encoding = detectEncoding(message, additional.encoding || 'auto');

      if (message.length === 0 || message.length > 1600) {
        throw new NodeApiError(this.getNode(), {
          message: 'Message must be between 1 and 1600 characters',
        });
      }

      const toResult = normalizePhoneNumberToE164(toRaw);
      
      // Handle from field - if empty, skip normalization (will use default account number)
      let fromResult: { ok: boolean; value: string; error?: string };
      if (!fromRaw || fromRaw.trim() === '') {
        fromResult = { ok: true, value: '' };
      } else {
        const normalized = normalizePhoneNumberToE164(fromRaw);
        if (normalized.ok) {
          fromResult = { ok: true, value: normalized.value };
        } else {
          fromResult = { ok: false, value: fromRaw, error: normalized.error };
        }
      }

      const failIfUndeliverable = additional.failIfUndeliverable ?? true;

      if (!toResult.ok || !fromResult.ok) {
        if (failIfUndeliverable) {
          let errMsg: string | undefined;
          if (!toResult.ok) errMsg = toResult.error;
          if (!fromResult.ok) errMsg = fromResult.error;
          throw new NodeApiError(this.getNode(), { message: `Invalid phone number: ${errMsg}` });
        }
      }

      if (additional.rateLimit && additional.rateLimit > 0 && itemIndex > 0) {
        await new Promise((resolve) => setTimeout(resolve, additional.rateLimit));
      }

      const queuedAt = new Date().toISOString();

      if (useSandbox) {
        const output: SmsOutputItem = {
          provider: 'MessageMedia',
          to: toResult.ok ? toResult.value : toRaw,
          from: fromResult.ok ? fromResult.value : fromRaw,
          message,
          status: toResult.ok && fromResult.ok ? 'queued' : 'failed',
          providerMessageId: toResult.ok && fromResult.ok ? `sandbox_${Date.now()}` : null,
          error: toResult.ok && fromResult.ok ? null : 'Number normalization failed',
          meta: {
            cost: { currency: 'USD', amount: 0 },
            encoding,
            queuedAt,
            rateLimitAppliedMs: additional.rateLimit || 0,
          },
        };
        returnData.push({ json: output as unknown as IDataObject });
        continue;
      }

      const credentials = (await this.getCredentials('messageMediaApi')) as unknown as Record<string, string>;
      const strategy = new MessageMediaProvider();

      try {
        const providerResult = await strategy.send({
          to: toResult.ok ? toResult.value : toRaw,
          from: fromResult.ok ? fromResult.value : fromRaw,
          message,
          statusCallbackUrl: additional.statusCallbackUrl || undefined,
          encoding: additional.encoding || 'auto',
          testMode,
          providerRegion: undefined, // MessageMedia does not have a region concept
          helpers: this.helpers,
          credentials,
        });

        const output: SmsOutputItem = {
          provider: 'MessageMedia',
          to: toResult.ok ? toResult.value : toRaw,
          from: fromResult.ok ? fromResult.value : (fromRaw.trim() ? fromRaw : 'default_account_number'),
          message,
          status: providerResult.status,
          providerMessageId: providerResult.providerMessageId ?? null,
          error: providerResult.error ?? null,
          raw: (additional.returnRaw && providerResult.raw) || undefined,
          meta: {
            cost: { currency: 'USD', amount: 0 },
            encoding,
            queuedAt,
            rateLimitAppliedMs: additional.rateLimit || 0,
          },
        };
        returnData.push({ json: output as unknown as IDataObject });
      } catch (error) {
        if (failIfUndeliverable) {
          const e = error as Error;
          throw new NodeApiError(this.getNode(), { message: e.message });
        } else {
          const output: SmsOutputItem = {
            provider: 'MessageMedia',
            to: toResult.ok ? toResult.value : toRaw,
            from: fromResult.ok ? fromResult.value : (fromRaw.trim() ? fromRaw : 'default_account_number'),
            message,
            status: 'failed',
            providerMessageId: null,
            error: (error as Error).message,
            meta: {
              cost: { currency: 'USD', amount: 0 },
              encoding,
              queuedAt,
              rateLimitAppliedMs: additional.rateLimit || 0,
            },
          };
          returnData.push({ json: output as unknown as IDataObject });
        }
      }
    }

    return [returnData];
  }
}
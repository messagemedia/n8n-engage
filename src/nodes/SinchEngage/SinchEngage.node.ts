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
import type { SmsOutputItem, EncodingOption } from './types';
import { MessageMediaProvider } from './providers/MessageMediaProvider';
import { makeMessageMediaRequest } from '../../utils/messageMediaHttp';
import * as countries from 'i18n-iso-countries';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import enLocale = require('i18n-iso-countries/langs/en.json');

// Register English locale for country names
countries.registerLocale(enLocale);

// Generate country list for dropdown (sorted alphabetically by name)
function getCountryOptions() {
  const countryList = countries.getNames('en', { select: 'official' });
  return Object.entries(countryList)
    .map(([code, name]) => ({
      name: `${name} (${code})`,
      value: code,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export class SinchEngage implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sinch Engage',
    name: 'sinchEngage',
    icon: 'file:sinch-logo.png',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Send SMS and manage communications via Sinch Engage',
    defaults: {
      name: 'Sinch Engage',
    },
    inputs: ['main' as NodeConnectionType],
    outputs: ['main' as NodeConnectionType],
    credentials: [
      { name: 'messageMediaApi', required: true },
    ],
    properties: [
      // 1. RESOURCE
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'SMS',
            value: 'sms',
            description: 'Send and manage SMS messages',
          },
          {
            name: 'Blacklist',
            value: 'blacklist',
            description: 'Manage opt-out blacklist for phone numbers',
          },
        ],
        default: 'sms',
      },

      // 2. OPERATION
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['sms'],
          },
        },
        options: [
          {
            name: 'Send',
            value: 'send',
            description: 'Send an SMS message',
            action: 'Send an SMS',
          },
        ],
        default: 'send',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['blacklist'],
          },
        },
        options: [
          {
            name: 'Add',
            value: 'add',
            description: 'Add phone number(s) to blacklist',
            action: 'Add to blacklist',
          },
        ],
        default: 'add',
      },

      // 3. SMS FIELDS
      {
        displayName: 'To',
        name: 'to',
        type: 'string',
        required: true,
        default: '',
        description: 'Destination phone number (E.164 preferred, e.g., +61437536808, or local format like 0437536808 requires Country field)',
        displayOptions: {
          show: {
            resource: ['sms'],
            operation: ['send'],
          },
        },
      },
      {
        displayName: 'Country',
        name: 'defaultCountry',
        type: 'options',
        options: getCountryOptions(),
        default: '',
        required: false,
        description: 'Country for parsing local phone numbers (e.g., "0437 536 808" → "+61437536808" if Australia selected). Required for local/national format numbers without + prefix.',
        placeholder: 'Select a country...',
        displayOptions: {
          show: {
            resource: ['sms'],
            operation: ['send'],
          },
        },
      },
      {
        displayName: 'From',
        name: 'from',
        type: 'options',
        typeOptions: {
          loadOptionsMethod: 'getAccountNumbers',
        },
        default: '',
        required: false,
        description: 'Sender phone number. Leave empty to use account default number.',
        displayOptions: {
          show: {
            resource: ['sms'],
            operation: ['send'],
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
        description: 'Message to send, up to 1600 characters GSM7 encoding (standard characters) allows ~160 chars per SMS segment. Unicode/emoji uses UCS-2 encoding (~70 chars per segment). Longer messages are automatically split into multiple segments.',
        displayOptions: {
          show: {
            resource: ['sms'],
            operation: ['send'],
          },
        },
      },

      // 4. BLACKLIST FIELDS
      {
        displayName: 'Phone Numbers',
        name: 'blacklistNumbers',
        type: 'string',
        required: true,
        default: '',
        description: 'Phone number(s) to add to blacklist. Enter one number per line in E.164 format (e.g., +61437536808). Multiple numbers will be processed in a single API call.',
        typeOptions: {
          rows: 5,
        },
        displayOptions: {
          show: {
            resource: ['blacklist'],
            operation: ['add'],
          },
        },
      },
      {
        displayName: 'Country',
        name: 'blacklistCountry',
        type: 'options',
        options: getCountryOptions(),
        default: '',
        required: false,
        description: 'Country for parsing local phone numbers without international prefix',
        placeholder: 'Select a country...',
        displayOptions: {
          show: {
            resource: ['blacklist'],
            operation: ['add'],
          },
        },
      },

      // 5. ADDITIONAL FIELDS (SMS only)
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: {
          show: {
            resource: ['sms'],
            operation: ['send'],
          },
        },
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
            return [
              {
                name: 'Use Account Default',
                value: '',
                description: 'No credentials configured',
              }
            ];
          }

          // Fetch all pages of account numbers from MessageMedia API
          const allNumbers: any[] = [];
          let nextToken: string | undefined;
          let pageCount = 0;
          const maxPages = 10; // Safety limit to prevent infinite loops

          do {
            const params: Record<string, string> = {};
            if (nextToken) {
              params.page_token = nextToken;
            }

            const response = await makeMessageMediaRequest(this, {
              method: 'GET',
              url: 'https://api.messagemedia.com/v1/messaging/numbers/sender_address/addresses',
              qs: params,
            });

            // Extract numbers from current page
            if (response.data && Array.isArray(response.data)) {
              allNumbers.push(...response.data);
            }

            // Check for next page
            nextToken = response.pagination?.next_token;
            pageCount++;

          } while (nextToken && pageCount < maxPages);

          // Build options array starting with "Use Default" option
          const options: Array<{ name: string; value: string; description?: string }> = [
            {
              name: 'Use Account Default',
              value: '',
              description: 'Use the default sender number configured on your Sinch Engage account',
            }
          ];

          // Process each number into a dropdown option
          for (const numberObj of allNumbers) {
            if (!numberObj.sender_address) continue;

            // Extract data from API response
            const phoneNumber = numberObj.sender_address;
            const label = numberObj.label?.trim() || '';
            const capabilities = numberObj.number?.capabilities || [];
            const numberType = numberObj.number?.type || numberObj.sender_address_type || 'UNKNOWN';
            const displayStatus = numberObj.display_status;
            const destinationCountries = numberObj.destination_countries || [];

            // Build the display name (identifier only: phone number + label)
            let displayName: string;
            if (label) {
              // If there's a label: "+1234567890 - Label"
              displayName = `${phoneNumber} - ${label}`;
            } else {
              // No label: "+1234567890"
              displayName = phoneNumber;
            }

            // Build description with all technical specs/metadata
            const descriptionParts: string[] = [];
            
            // Add capabilities (SMS, MMS, etc.)
            if (capabilities.length > 0) {
              descriptionParts.push(capabilities.join(', '));
            } else {
              descriptionParts.push('SMS'); // Default assumption
            }
            
            // Add number type
            descriptionParts.push(`Type: ${numberType}`);
            
            // Add destination countries if available
            if (destinationCountries.length > 0) {
              const countriesString = destinationCountries.join(', ');
              descriptionParts.push(`Countries: ${countriesString}`);
            }

            const description = descriptionParts.join(' | ');

            // Skip expired numbers
            if (displayStatus === 'EXPIRED') {
              continue;
            }

            options.push({
              name: displayName,
              value: phoneNumber,
              description,
            });
          }

          return options;
          
        } catch (error) {
          // Return default option on error so the node doesn't break
          return [
            {
              name: 'Use Account Default',
              value: '',
              description: 'Error loading numbers - will use account default',
            }
          ];
        }
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const credentials = (await this.getCredentials('messageMediaApi')) as unknown as Record<string, string>;

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const resource = this.getNodeParameter('resource', itemIndex) as string;
      const operation = this.getNodeParameter('operation', itemIndex) as string;

      if (resource === 'sms') {
        if (operation === 'send') {
          // SEND SMS OPERATION
          const toRaw = this.getNodeParameter('to', itemIndex) as string;
          const defaultCountry = this.getNodeParameter('defaultCountry', itemIndex, '') as string || undefined;
          const fromRaw = this.getNodeParameter('from', itemIndex, '') as string;
          
          const message = this.getNodeParameter('message', itemIndex) as string;

          const additional = this.getNodeParameter('additionalFields', itemIndex, {}) as {
            statusCallbackUrl?: string;
            encoding?: EncodingOption;
          };

          const encoding = detectEncoding(message, additional.encoding || 'auto');

          if (message.length === 0 || message.length > 1600) {
            throw new NodeApiError(this.getNode(), {
              message: 'Message must be between 1 and 1600 characters',
            });
          }

          const toResult = normalizePhoneNumberToE164(toRaw, defaultCountry);
          
          // Handle from field - if empty, skip normalization (will use default account number)
          let fromResult: { ok: boolean; value: string; error?: string };
          if (!fromRaw || fromRaw.trim() === '') {
            fromResult = { ok: true, value: '' };
          } else {
            const normalized = normalizePhoneNumberToE164(fromRaw, defaultCountry);
            if (normalized.ok) {
              fromResult = { ok: true, value: normalized.value };
            } else {
              fromResult = { ok: false, value: fromRaw, error: normalized.error };
            }
          }

          // Always throw error if phone number validation fails
          if (!toResult.ok || !fromResult.ok) {
            let errMsg: string | undefined;
            if (!toResult.ok) errMsg = toResult.error;
            if (!fromResult.ok) errMsg = fromResult.error;
            throw new NodeApiError(this.getNode(), { message: `Invalid phone number: ${errMsg}` });
          }

          const queuedAt = new Date().toISOString();

          const strategy = new MessageMediaProvider();

          try {
            const providerResult = await strategy.send({
              to: toResult.ok ? toResult.value : toRaw,
              from: fromResult.ok ? fromResult.value : fromRaw,
              message,
              statusCallbackUrl: additional.statusCallbackUrl || undefined,
              encoding: additional.encoding || 'auto',
              testMode: false,
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
              meta: {
                cost: { currency: 'USD', amount: 0 },
                encoding,
                queuedAt,
              },
            };
            returnData.push({ json: output as unknown as IDataObject });
          } catch (error) {
            const e = error as Error;
            throw new NodeApiError(this.getNode(), { message: e.message });
          }
        }
      } else if (resource === 'blacklist') {
        if (operation === 'add') {
          // ADD TO BLACKLIST OPERATION
          const numbersRaw = this.getNodeParameter('blacklistNumbers', itemIndex) as string;
          const blacklistCountry = this.getNodeParameter('blacklistCountry', itemIndex, '') as string || undefined;

          // Parse and normalize phone numbers (one per line)
          const lines = numbersRaw.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          
          if (lines.length === 0) {
            throw new NodeApiError(this.getNode(), {
              message: 'At least one phone number is required',
            });
          }

          const normalizedNumbers: string[] = [];
          for (const line of lines) {
            const result = normalizePhoneNumberToE164(line, blacklistCountry);
            if (!result.ok) {
              throw new NodeApiError(this.getNode(), {
                message: `Invalid phone number "${line}": ${result.error}`,
              });
            }
            normalizedNumbers.push(result.value);
          }

          try {
            // Call MessageMedia blacklist API
            const response = await makeMessageMediaRequest(this, {
              method: 'POST',
              url: 'https://api.messagemedia.com/v1/blacklist/numbers',
              body: {
                numbers: normalizedNumbers,
              },
            });

            returnData.push({
              json: {
                success: true,
                numbersAdded: normalizedNumbers.length,
                numbers: normalizedNumbers,
                response,
              } as unknown as IDataObject,
            });
          } catch (error) {
            const e = error as Error;
            throw new NodeApiError(this.getNode(), { message: `Failed to add numbers to blacklist: ${e.message}` });
          }
        }
      }
    }

    return [returnData];
  }
}
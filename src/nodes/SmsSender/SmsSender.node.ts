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
import * as countries from 'i18n-iso-countries';

// Register English locale for country names
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

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

export class SmsSender implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sinch Engage',
    name: 'smsSender',
    icon: 'file:sinch-logo.png',
    group: ['transform'],
    version: 1,
    description: 'Send SMS via Sinch Engage',
    defaults: {
      name: 'Sinch Engage',
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
        description: 'Destination phone number (E.164 preferred, e.g., +61437536808, or local format like 0437536808)',
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
      
      // 2. ADDITIONAL FIELDS
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
            return [
              {
                name: 'Use Account Default',
                value: '',
                description: 'No credentials configured',
              }
            ];
          }

          // Fetch all pages of account numbers from MessageMedia API
          let allNumbers: any[] = [];
          let nextToken: string | undefined;
          let pageCount = 0;
          const maxPages = 10; // Safety limit to prevent infinite loops

          do {
            const params: Record<string, string> = {};
            if (nextToken) {
              params.page_token = nextToken;
            }

            const queryString = Object.keys(params).length > 0 
              ? '?' + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
              : '';

            const response = await this.helpers.request({
              method: 'GET',
              uri: `https://api.messagemedia.com/v1/messaging/numbers/sender_address/addresses${queryString}`,
              auth: { user: credentials.apiKey, pass: credentials.apiSecret },
              headers: { 'Content-Type': 'application/json' },
              json: true,
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
              description: 'Use the default sender number configured on your MessageMedia account',
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

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const toRaw = this.getNodeParameter('to', itemIndex) as string;
      const defaultCountry = this.getNodeParameter('defaultCountry', itemIndex, '') as string || undefined;
      const fromRaw = this.getNodeParameter('from', itemIndex, '') as string;
      
      const message = this.getNodeParameter('message', itemIndex) as string;

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

      const credentials = (await this.getCredentials('messageMediaApi')) as unknown as Record<string, string>;
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
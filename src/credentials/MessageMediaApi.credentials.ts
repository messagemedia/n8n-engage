import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class MessageMediaApi implements ICredentialType {
  name = 'messageMediaApi';
  displayName = 'MessageMedia API';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      default: '',
      required: true,
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
    },
  ];
}
import type { 
  IAuthenticateGeneric, 
  ICredentialTestRequest, 
  ICredentialType, 
  INodeProperties 
} from 'n8n-workflow';

export class MessageMediaApi implements ICredentialType {
  name = 'messageMediaApi';
  displayName = 'MessageMedia API';
  documentationUrl = 'https://developers.messagemedia.com/';
  
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

  // This tells n8n how to authenticate requests using these credentials
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      auth: {
        username: '={{$credentials.apiKey}}',
        password: '={{$credentials.apiSecret}}',
      },
    },
  };

  // Test the credentials by making a simple API call
  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.messagemedia.com',
      url: '/v1/int-crm/integrations/account',
      method: 'GET',
    },
  };
}
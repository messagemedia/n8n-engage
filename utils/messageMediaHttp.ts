import type { IExecuteFunctions, IHookFunctions, ILoadOptionsFunctions } from 'n8n-workflow';

/**
 * Shared HTTP helper for MessageMedia API requests.
 * Ensures all requests use platform-level networking (httpRequest)
 * with consistent auth, headers, and timeout settings.
 *
 * @param context - The n8n function context (IHookFunctions, IExecuteFunctions, etc.)
 * @param options - HTTP request options (method, url, body, etc.)
 * @returns The parsed JSON response from the API
 *
 * @example
 * ```typescript
 * const response = await makeMessageMediaRequest(this, {
 *   method: 'POST',
 *   url: 'https://api.messagemedia.com/v1/messages',
 *   body: { messages: [...] },
 * });
 * ```
 */
export async function makeMessageMediaRequest<T = any>(
  context: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
  options: {
    method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';
    url: string;
    body?: any;
    qs?: Record<string, any>;
  },
): Promise<T> {
  // Retrieve MessageMedia credentials
  const credentials = (await context.getCredentials('messageMediaApi')) as {
    apiKey: string;
    apiSecret: string;
  };

  const response = await context.helpers.httpRequest({
    method: options.method,
    url: options.url,
    body: options.body,
    qs: options.qs,
    auth: {
      username: credentials.apiKey,
      password: credentials.apiSecret,
    },
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 15000,
  });

  return response as T;
}

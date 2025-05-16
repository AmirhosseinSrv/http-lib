import type { ZodTypeAny } from 'zod';

import type { TRequestInterceptor, TResponseInterceptor } from './types';

export default class FetchHttpClient {
  private static instance: FetchHttpClient;
  private requestInterceptors: TRequestInterceptor[] = [];
  private responseInterceptors: TResponseInterceptor[] = [];

  constructor() {
    // Initialize any properties if needed
  }

  static getInstance(): FetchHttpClient {
    if (!FetchHttpClient.instance) {
      FetchHttpClient.instance = new FetchHttpClient();
    }

    return FetchHttpClient.instance;
  }

  private async applyRequestInterceptors(
    url: string,
    options: RequestInit
  ): Promise<{ url: string; options: RequestInit }> {
    for (const requestInterceptor of this.requestInterceptors) {
      const { url: interceptedUrl, options: interceptedOptions } = await requestInterceptor(url, options);

      url = interceptedUrl;
      options = { ...options, ...interceptedOptions };
    }

    return { url, options };
  }

  private async applyResponseInterceptors(response: Response): Promise<Response> {
    for (const responseInterceptor of this.responseInterceptors) {
      response = await responseInterceptor(response);
    }

    return response;
  }

  private async fetch(url: string, options?: RequestInit, responseZodSchema?: ZodTypeAny): Promise<Response> {
    try {
      const { url: interceptedUrl, options: interceptedOptions } = await this.applyRequestInterceptors(
        url,
        options || {}
      );

      const response = await fetch(interceptedUrl, interceptedOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
      }

      try {
        const clonedResponse = response.clone();
        const responseData = await clonedResponse.json();

        if (responseZodSchema) {
          responseZodSchema.parseAsync(responseData).catch((error) => {
            console.error('Zod validation error:', error);
          });
        }
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
      }

      const interceptedResponse = await this.applyResponseInterceptors(response);

      return interceptedResponse;
    } catch (error) {
      console.error('Fetch operation failed:', error);

      throw error;
    }
  }

  registerRequestInterceptors(requestInterceptors: TRequestInterceptor[]) {
    for (const requestInterceptor of requestInterceptors) {
      this.requestInterceptors.push(requestInterceptor);
    }
  }

  registerResponseInterceptors(responseInterceptors: TResponseInterceptor[]) {
    for (const responseInterceptor of responseInterceptors) {
      this.responseInterceptors.push(responseInterceptor);
    }
  }

  async get(url: string, options?: RequestInit, responseZodSchema?: ZodTypeAny): Promise<Response> {
    const response = await this.fetch(url, { method: 'GET', ...options }, responseZodSchema);

    return response;
  }

  async post(url: string, body: unknown, options?: RequestInit, responseZodSchema?: ZodTypeAny): Promise<Response> {
    const response = await this.fetch(
      url,
      {
        method: 'POST',
        body: JSON.stringify(body),
        ...options,
      },
      responseZodSchema
    );

    return response;
  }

  async put(url: string, body: unknown, options?: RequestInit, responseZodSchema?: ZodTypeAny): Promise<Response> {
    const response = await this.fetch(
      url,
      {
        method: 'PUT',
        body: JSON.stringify(body),
        ...options,
      },
      responseZodSchema
    );

    return response;
  }

  async delete(url: string, options?: RequestInit, responseZodSchema?: ZodTypeAny): Promise<Response> {
    const response = await this.fetch(url, { method: 'DELETE', ...options }, responseZodSchema);

    return response;
  }
}

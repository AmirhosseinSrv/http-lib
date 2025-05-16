import ky from 'ky';
import type { Options } from 'ky';
import type { ZodTypeAny } from 'zod';

import type { TRequestInterceptor, TResponseInterceptor, TRequestMethods } from './types';

export default class KyHttpClient {
  private static instance: KyHttpClient;
  private requestInterceptors: TRequestInterceptor[] = [];
  private responseInterceptors: TResponseInterceptor[] = [];

  constructor() {
    // Initialize any properties if needed
  }

  static getInstance(): KyHttpClient {
    if (!KyHttpClient.instance) {
      KyHttpClient.instance = new KyHttpClient();
    }

    return KyHttpClient.instance;
  }

  private async applyRequestInterceptors(url: string, options: Options): Promise<{ url: string; options: Options }> {
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

  async request(
    method: TRequestMethods,
    url: string,
    body?: unknown,
    options?: Options,
    responseZodSchema?: ZodTypeAny
  ): Promise<Response> {
    try {
      let requestOptions: Options = {
        method,
        ...options,
      };

      if (body && method !== 'GET') {
        requestOptions = {
          ...requestOptions,
          json: body,
        };
      }

      const { url: interceptedUrl, options: interceptedOptions } = await this.applyRequestInterceptors(
        url,
        requestOptions
      );

      const hooks = {
        afterResponse: [
          async (_request: Request, _options: Options, response: Response) => {
            try {
              if (responseZodSchema) {
                const clonedResponse = response.clone();
                const responseData = await clonedResponse.json();

                responseZodSchema.parseAsync(responseData).catch((error) => {
                  console.error('Zod validation error:', error);
                });
              }

              const interceptedResponse = await this.applyResponseInterceptors(response);
              return interceptedResponse;
            } catch (error) {
              console.error('Error processing response:', error);
              return response;
            }
          },
        ],
      };

      const finalOptions = {
        ...interceptedOptions,
        hooks,
      };

      const response = await ky(interceptedUrl, finalOptions);

      return response;
    } catch (error: unknown) {
      console.error('Ky request failed:', error);

      if (error && typeof error === 'object' && 'response' in error && error.response instanceof Response) {
        const errorResponse = error.response;

        try {
          const interceptedErrorResponse = await this.applyResponseInterceptors(errorResponse);

          (error as { response: Response }).response = interceptedErrorResponse;
        } catch (interceptorError) {
          console.error('Error in response interceptor:', interceptorError);
        }
      }

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

  async get(url: string, options?: Options, responseZodSchema?: ZodTypeAny): Promise<Response> {
    return this.request('GET', url, undefined, options, responseZodSchema);
  }

  async post(url: string, body: unknown, options?: Options, responseZodSchema?: ZodTypeAny): Promise<Response> {
    return this.request('POST', url, body, options, responseZodSchema);
  }

  async put(url: string, body: unknown, options?: Options, responseZodSchema?: ZodTypeAny): Promise<Response> {
    return this.request('PUT', url, body, options, responseZodSchema);
  }

  async delete(url: string, options?: Options, responseZodSchema?: ZodTypeAny): Promise<Response> {
    return this.request('DELETE', url, undefined, options, responseZodSchema);
  }
}

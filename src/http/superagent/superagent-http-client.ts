import superagent from 'superagent';
import type { Request, Response } from 'superagent';
import type { ZodTypeAny } from 'zod';

import type { TRequestInterceptor, TResponseInterceptor, TRequestMethods } from './types';

export default class SuperAgentHttpClient {
  private static instance: SuperAgentHttpClient;
  private requestInterceptors: TRequestInterceptor[] = [];
  private responseInterceptors: TResponseInterceptor[] = [];

  constructor() {
    // Initialize any properties if needed
  }

  static getInstance(): SuperAgentHttpClient {
    if (!SuperAgentHttpClient.instance) {
      SuperAgentHttpClient.instance = new SuperAgentHttpClient();
    }

    return SuperAgentHttpClient.instance;
  }

  private async applyRequestInterceptors(url: string, request: Request): Promise<{ url: string; request: Request }> {
    for (const requestInterceptor of this.requestInterceptors) {
      const { url: interceptedUrl, request: interceptedRequest } = await requestInterceptor(url, request);

      url = interceptedUrl;
      request = interceptedRequest;
    }

    return { url, request };
  }

  private async applyResponseInterceptors(response: Response): Promise<Response> {
    for (const responseInterceptor of this.responseInterceptors) {
      response = await responseInterceptor(response);
    }

    return response;
  }

  private async sendRequest(
    method: TRequestMethods,
    url: string,
    body?: unknown,
    responseZodSchema?: ZodTypeAny
  ): Promise<Response> {
    let request = superagent(method, url);

    const { url: interceptedUrl, request: interceptedRequest } = await this.applyRequestInterceptors(url, request);

    request = interceptedRequest;

    if (url !== interceptedUrl) {
      request = superagent(method.toLowerCase(), interceptedUrl);
    }

    if (body && method !== 'GET') {
      request = request.send(body);
    }

    try {
      const response = await request;

      if (responseZodSchema) {
        responseZodSchema.parseAsync(response.body).catch((error) => {
          console.error('Zod validation error:', error);
        });
      }

      const interceptedResponse = await this.applyResponseInterceptors(response);

      return interceptedResponse;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object'
      ) {
        try {
          const errorResponse = error.response as Response;

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

  async get(url: string, responseZodSchema?: ZodTypeAny): Promise<Response> {
    return await this.sendRequest('GET', url, undefined, responseZodSchema);
  }

  async post(url: string, body: unknown, responseZodSchema?: ZodTypeAny): Promise<Response> {
    return await this.sendRequest('POST', url, body, responseZodSchema);
  }

  async put(url: string, body: unknown, responseZodSchema?: ZodTypeAny): Promise<Response> {
    return await this.sendRequest('PUT', url, body, responseZodSchema);
  }

  async delete(url: string, responseZodSchema?: ZodTypeAny): Promise<Response> {
    return await this.sendRequest('DELETE', url, undefined, responseZodSchema);
  }

  withHeader(request: Request, name: string, value: string): Request {
    return request.set(name, value);
  }

  withHeaders(request: Request, headers: Record<string, string>): Request {
    return request.set(headers);
  }

  withQuery(request: Request, query: Record<string, string | number | boolean>): Request {
    return request.query(query);
  }

  withTimeout(request: Request, timeout: number): Request {
    return request.timeout(timeout);
  }

  withAttachment(request: Request, field: string, file: string | Buffer, filename?: string): Request {
    return request.attach(field, file, filename);
  }

  withFormData(request: Request, data: Record<string, string | Buffer>): Request {
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        request = request.field(key, value);
      } else {
        request = request.attach(key, value);
      }
    }

    return request;
  }
}

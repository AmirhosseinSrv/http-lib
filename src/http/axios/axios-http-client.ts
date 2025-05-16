import axiosPackage from 'axios';
import type { ZodTypeAny } from 'zod';
import type { Axios, AxiosRequestConfig, AxiosResponse } from 'axios';

import type { TRequestInterceptor, TRequestMethods, TResponseInterceptor } from './types';

export default class AxiosHttpClient {
  private static instance: AxiosHttpClient;
  private axios: Axios = axiosPackage;

  private constructor() {
    // Initialize any properties if needed
  }

  static getInstance(): AxiosHttpClient {
    if (!AxiosHttpClient.instance) {
      AxiosHttpClient.instance = new AxiosHttpClient();
    }

    return AxiosHttpClient.instance;
  }

  private async sendRequest<TResponse>(
    method: TRequestMethods,
    url: string,
    data?: unknown,
    requestConfig?: AxiosRequestConfig,
    responseZodSchema?: ZodTypeAny
  ): Promise<AxiosResponse<TResponse>> {
    try {
      const requestFn = {
        GET: () => this.axios.get<TResponse>(url, requestConfig),
        POST: () => this.axios.post<TResponse>(url, data, requestConfig),
        PUT: () => this.axios.put<TResponse>(url, data, requestConfig),
        DELETE: () => this.axios.delete<TResponse>(url, requestConfig),
      };

      if (requestFn[method]) {
        const response = await requestFn[method]();

        if (responseZodSchema) {
          responseZodSchema.parseAsync(response.data).catch((error) => {
            console.error('Zod validation error:', error);
          });
        }

        return response;
      } else {
        throw new Error(`Unsupported HTTP method: ${method}`);
      }
    } catch (error) {
      console.error(`Axios ${method} request failed:`, error);

      throw error;
    }
  }

  registerRequestInterceptors(requestInterceptors: TRequestInterceptor[]) {
    for (const requestInterceptor of requestInterceptors) {
      this.axios.interceptors.request.use(requestInterceptor);
    }
  }

  registerResponseInterceptors(responseInterceptors: TResponseInterceptor[]) {
    for (const responseInterceptor of responseInterceptors) {
      this.axios.interceptors.response.use(responseInterceptor);
    }
  }

  async get<TResponse>(url: string, requestConfig?: AxiosRequestConfig, responseZodSchema?: ZodTypeAny) {
    return this.sendRequest<TResponse>('GET', url, undefined, requestConfig, responseZodSchema);
  }

  async put<TResponse>(url: string, data: unknown, requestConfig?: AxiosRequestConfig, responseZodSchema?: ZodTypeAny) {
    return this.sendRequest<TResponse>('PUT', url, data, requestConfig, responseZodSchema);
  }

  async post<TResponse>(
    url: string,
    data: unknown,
    requestConfig?: AxiosRequestConfig,
    responseZodSchema?: ZodTypeAny
  ) {
    return this.sendRequest<TResponse>('POST', url, data, requestConfig, responseZodSchema);
  }

  async delete<TResponse>(url: string, requestConfig?: AxiosRequestConfig, responseZodSchema?: ZodTypeAny) {
    return this.sendRequest<TResponse>('DELETE', url, undefined, requestConfig, responseZodSchema);
  }
}

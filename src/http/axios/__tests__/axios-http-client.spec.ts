import { describe, it, expect, beforeEach, vi } from 'vitest';
import axiosPackage from 'axios';
import type { AxiosResponse, AxiosStatic, InternalAxiosRequestConfig } from 'axios';

import AxiosHttpClient from '../axios-http-client';
import type { TRequestInterceptor, TResponseInterceptor } from '../types';

vi.mock('axios');

describe('AxiosHttpClient (singleton + interceptors)', () => {
  let axiosInstance: AxiosHttpClient;

  // spy on interceptors
  const mockRequestUse = vi.spyOn(axiosPackage.interceptors.request, 'use');
  const mockResponseUse = vi.spyOn(axiosPackage.interceptors.response, 'use');

  // spy on HTTP methods
  const mockGet = vi.spyOn(axiosPackage, 'get');
  const mockPost = vi.spyOn(axiosPackage, 'post');
  const mockPut = vi.spyOn(axiosPackage, 'put');
  const mockDelete = vi.spyOn(axiosPackage, 'delete');

  beforeEach(() => {
    // reset singleton instance and its interceptors
    // @ts-expect-error resetting private static
    // This hack lets us get a “fresh” instance each time.
    delete AxiosHttpClient.instance;

    axiosInstance = AxiosHttpClient.getInstance();

    const axiosInstanceWithStub = axiosInstance as unknown as {
      axios: AxiosStatic;
    };

    const fakeAxios = {
      interceptors: {
        request: { use: mockRequestUse },
        response: { use: mockResponseUse },
      },
      get: mockGet,
      post: mockPost,
      put: mockPut,
      delete: mockDelete,
    } as unknown as AxiosStatic;

    axiosInstanceWithStub.axios = fakeAxios;

    mockRequestUse.mockClear();
    mockResponseUse.mockClear();
    mockGet.mockClear();
    mockPost.mockClear();
    mockPut.mockClear();
    mockDelete.mockClear();
  });

  it('getInstance() always returns the same object', () => {
    expect(AxiosHttpClient.getInstance()).toBe(axiosInstance);
  });

  it('registerRequestInterceptors calls axios.interceptors.request.use for each fn', () => {
    const urlQueryStringInterceptor: TRequestInterceptor = (config) => {
      config.url = (config.url ?? '') + '?foo=bar';
      config.headers['X-Test'] = true;

      return config;
    };

    axiosInstance.registerRequestInterceptors([urlQueryStringInterceptor]);

    expect(mockRequestUse).toHaveBeenCalledTimes(1);
    expect(mockRequestUse).toHaveBeenCalledWith(urlQueryStringInterceptor);
  });

  it('registerResponseInterceptors calls axios.interceptors.response.use for each fn', () => {
    const responseInterceptor: TResponseInterceptor = (response) => {
      response.data = { ...(response.data as object), ok: true };

      return response;
    };

    axiosInstance.registerResponseInterceptors([responseInterceptor]);

    expect(mockResponseUse).toHaveBeenCalledTimes(1);
    expect(mockResponseUse).toHaveBeenCalledWith(responseInterceptor);
  });

  it('get() forwards to axios.get and returns the response', async () => {
    const fakeResponse: AxiosResponse<{ value: number }> = {
      data: { value: 1 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    mockGet.mockResolvedValue(fakeResponse);

    const result = await axiosInstance.get<{ value: number }>('/test', {
      headers: { Accept: 'application/json' },
    });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith('/test', {
      headers: { Accept: 'application/json' },
    });
    expect(result).toBe(fakeResponse);
  });

  it('post() forwards to axios.post and returns the response', async () => {
    const dummyPayload = { name: 'Amirhossein', age: 26 };
    const fakeResponse: AxiosResponse = {
      data: { success: true },
      status: 201,
      statusText: 'Created',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    mockPost.mockResolvedValue(fakeResponse);

    const result = await axiosInstance.post('/test', dummyPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith('/test', dummyPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toBe(fakeResponse);
  });

  it('put() forwards to axios.put and returns the response', async () => {
    const dummyPayload = { active: false };
    const fakeResponse: AxiosResponse = {
      data: { updated: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    mockPut.mockResolvedValue(fakeResponse);

    const result = await axiosInstance.put('/test', dummyPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(mockPut).toHaveBeenCalledTimes(1);
    expect(mockPut).toHaveBeenCalledWith('/test', dummyPayload, {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(result).toBe(fakeResponse);
  });

  it('delete() forwards to axios.delete and returns the response', async () => {
    const fakeResponse: AxiosResponse = {
      data: null,
      status: 204,
      statusText: 'No Content',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    mockDelete.mockResolvedValue(fakeResponse);

    const result = await axiosInstance.delete('/test', {
      headers: { Authorization: 'token' },
    });

    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith('/test', {
      headers: { Authorization: 'token' },
    });
    expect(result).toBe(fakeResponse);
  });
});

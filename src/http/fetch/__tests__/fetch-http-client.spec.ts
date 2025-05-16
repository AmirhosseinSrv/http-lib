import { describe, it, expect, beforeEach, vi } from 'vitest';

import FetchHttpClient from '../fetch-http-client';
import type { TRequestInterceptor, TResponseInterceptor } from '../types';

// helper to clear out private interceptor arrays
function resetInterceptors(fetchInstance: FetchHttpClient) {
  // @ts-expect-error private access for test
  fetchInstance.requestInterceptors = [];
  // @ts-expect-error private access for test
  fetchInstance.responseInterceptors = [];
}

describe('FetchHttpClient (singleton + interceptors)', () => {
  let fetchInstance: FetchHttpClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    // reset singleton instance and its interceptors
    // @ts-expect-error resetting private static
    // This hack lets us get a “fresh” instance each time.
    delete FetchHttpClient.instance;

    fetchInstance = FetchHttpClient.getInstance();

    vi.stubGlobal('fetch', mockFetch);

    resetInterceptors(fetchInstance);
    mockFetch.mockReset();
  });

  it('getInstance() always returns the same object', () => {
    const secondFetchInstance = FetchHttpClient.getInstance();

    expect(secondFetchInstance).toBe(fetchInstance);
  });

  it('applies request interceptors in order and use their transformed url/options', async () => {
    const urlQueryStringInterceptor: TRequestInterceptor = (url, options) => {
      return {
        url: url + '?foo=bar',
        options: {
          ...options,
          headers: {
            ...(options.headers as Record<string, string>),
            'X-Test': 'true',
          },
        },
      };
    };

    fetchInstance.registerRequestInterceptors([urlQueryStringInterceptor]);

    const dummyResponse = new Response(JSON.stringify({ message: 'OK' }), { status: 200 });

    mockFetch.mockResolvedValue(dummyResponse);

    const res = await fetchInstance.get('/test', {
      headers: { Accept: 'application/json' },
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith('/test?foo=bar', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Test': 'true',
      },
    });
    expect(res).toBe(dummyResponse);
  });

  it('applies multiple request interceptors in sequence', async () => {
    const urlPlusAInterceptor: TRequestInterceptor = (url, options) => ({ url: url + '/A', options });
    const urlPlusBInterceptor: TRequestInterceptor = (url, options) => ({ url: url + '/B', options });

    fetchInstance.registerRequestInterceptors([urlPlusAInterceptor, urlPlusBInterceptor]);

    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 204 }));
    await fetchInstance.get('/test');

    expect(mockFetch).toHaveBeenCalledWith('/test/A/B', expect.any(Object));
  });

  it('applies response interceptors in order, allowing transformation', async () => {
    const dummyResponse = new Response(JSON.stringify({ value: 1 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    mockFetch.mockResolvedValue(dummyResponse);

    const incrementInterceptor: TResponseInterceptor = async (response) => {
      const data = await response.json();

      return new Response(JSON.stringify({ value: data.value + 1 }), {
        status: response.status,
        headers: response.headers,
      });
    };

    fetchInstance.registerResponseInterceptors([incrementInterceptor]);

    const response = await fetchInstance.get('/test');
    const data = await response.json();

    expect(data).toEqual({ value: 2 });
  });

  it('post() stringifies the body and sets method to POST', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 201 }));

    const dummyPayload = { name: 'Amirhossein', age: 26 };

    await fetchInstance.post('/test', dummyPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(dummyPayload),
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('put() stringifies the body and sets method to PUT', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    const dummyPayload = { active: false };

    await fetchInstance.put('/test', dummyPayload);

    expect(mockFetch).toHaveBeenCalledWith(
      '/test',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(dummyPayload),
      })
    );
  });

  it('delete() sets method to DELETE', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({}), { status: 204 }));

    await fetchInstance.delete('/test');

    expect(mockFetch).toHaveBeenCalledWith('/test', expect.objectContaining({ method: 'DELETE' }));
  });
});

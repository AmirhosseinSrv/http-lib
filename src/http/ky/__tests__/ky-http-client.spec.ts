import { describe, it, expect, beforeEach, vi } from 'vitest';
import ky from 'ky';

import KyHttpClient from '../ky-http-client';
import type { TRequestInterceptor } from '../types';

vi.mock('ky', () => ({
  default: vi.fn(() => Promise.resolve(new Response())),
}));

function resetInterceptors(kyInstance: KyHttpClient) {
  // @ts-expect-error private access for test
  kyInstance.requestInterceptors = [];
  // @ts-expect-error private access for test
  kyInstance.responseInterceptors = [];
}

describe('KyHttpClient (singleton + interceptors)', () => {
  let kyInstance: KyHttpClient;

  beforeEach(() => {
    // Reset singleton instance and its interceptors
    // @ts-expect-error resetting private static
    KyHttpClient.instance = undefined;

    kyInstance = KyHttpClient.getInstance();

    resetInterceptors(kyInstance);
    vi.mocked(ky).mockClear();
  });

  it('getInstance() always returns the same object', () => {
    const secondKyInstance = KyHttpClient.getInstance();

    expect(secondKyInstance).toBe(kyInstance);
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

    kyInstance.registerRequestInterceptors([urlQueryStringInterceptor]);

    const dummyResponse = new Response(JSON.stringify({ message: 'OK' }), { status: 200 });

    vi.mocked(ky).mockResolvedValue(dummyResponse);

    const res = await kyInstance.get('/test', {
      headers: { Accept: 'application/json' },
    });

    expect(ky).toHaveBeenCalledTimes(1);
    expect(ky).toHaveBeenCalledWith(
      '/test?foo=bar',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
          'X-Test': 'true',
        }),
      })
    );
    expect(res).toBe(dummyResponse);
  });

  it('applies multiple request interceptors in sequence', async () => {
    const urlPlusAInterceptor: TRequestInterceptor = (url, options) => ({ url: url + '/A', options });
    const urlPlusBInterceptor: TRequestInterceptor = (url, options) => ({ url: url + '/B', options });

    kyInstance.registerRequestInterceptors([urlPlusAInterceptor, urlPlusBInterceptor]);

    vi.mocked(ky).mockResolvedValue(new Response(JSON.stringify({}), { status: 204 }));
    await kyInstance.get('/test');

    expect(ky).toHaveBeenCalledWith('/test/A/B', expect.any(Object));
  });

  it('post() adds json body and sets method to POST', async () => {
    vi.mocked(ky).mockResolvedValue(new Response(JSON.stringify({}), { status: 201 }));

    const dummyPayload = { name: 'Amirhossein', age: 26 };

    await kyInstance.post('/test', dummyPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(ky).toHaveBeenCalledWith(
      '/test',
      expect.objectContaining({
        method: 'POST',
        json: dummyPayload,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('put() adds json body and sets method to PUT', async () => {
    vi.mocked(ky).mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));

    const dummyPayload = { active: false };

    await kyInstance.put('/test', dummyPayload);

    expect(ky).toHaveBeenCalledWith(
      '/test',
      expect.objectContaining({
        method: 'PUT',
        json: dummyPayload,
      })
    );
  });

  it('delete() sets method to DELETE', async () => {
    vi.mocked(ky).mockResolvedValue(new Response(JSON.stringify({}), { status: 204 }));

    await kyInstance.delete('/test');

    expect(ky).toHaveBeenCalledWith('/test', expect.objectContaining({ method: 'DELETE' }));
  });
});

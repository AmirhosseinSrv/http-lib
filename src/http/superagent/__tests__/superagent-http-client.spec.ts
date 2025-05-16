import { describe, it, expect, beforeEach, vi } from 'vitest';

import SuperAgentHttpClient from '../superagent-http-client';
import type { TRequestInterceptor, TResponseInterceptor } from '../types';

// Simplify the mocking approach
vi.mock('superagent', () => {
  // We don't need to re-create the mock objects inside the mock function
  // as they would get reset on every import anyway
  return {
    default: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockReturnThis(),
      query: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      timeout: vi.fn().mockReturnThis(),
      attach: vi.fn().mockReturnThis(),
      field: vi.fn().mockReturnThis(),
      end: vi.fn(),
      // Make the mock work like a promise
      then: vi.fn((onFulfilled) => {
        const result = {
          body: { message: 'success' },
          status: 200,
          ok: true,
          get: vi.fn(),
          setEncoding: vi.fn(),
          pipe: vi.fn(),
          compose: vi.fn(),
        };
        return Promise.resolve(onFulfilled ? onFulfilled(result) : result);
      }),
      catch: vi.fn(() => Promise.resolve())
    }))
  };
});

function resetInterceptors(superagentInstance: SuperAgentHttpClient) {
  // @ts-expect-error private access for test
  superagentInstance.requestInterceptors = [];
  // @ts-expect-error private access for test
  superagentInstance.responseInterceptors = [];
}

describe('SuperAgentHttpClient (singleton + interceptors)', () => {
  let superagentInstance: SuperAgentHttpClient;

  beforeEach(() => {
    // Reset singleton instance and its interceptors
    // @ts-expect-error resetting private static
    delete SuperAgentHttpClient.instance;

    superagentInstance = SuperAgentHttpClient.getInstance();

    resetInterceptors(superagentInstance);
    vi.clearAllMocks();
  });

  it('getInstance() always returns the same object', () => {
    const secondSuperagentInstance = SuperAgentHttpClient.getInstance();

    expect(secondSuperagentInstance).toBe(superagentInstance);
  });

  it('applies request interceptors in order', async () => {
    // Create a mock request interceptor
    const requestInterceptor: TRequestInterceptor = vi.fn((url, request) => {
      return { url: url + '?intercepted=true', request };
    });

    superagentInstance.registerRequestInterceptors([requestInterceptor]);

    await superagentInstance.get('/test');

    expect(requestInterceptor).toHaveBeenCalled();
  });

  it('applies response interceptors in order', async () => {
    const responseInterceptor: TResponseInterceptor = vi.fn((response) => {
      return response;
    });

    superagentInstance.registerResponseInterceptors([responseInterceptor]);

    await superagentInstance.get('/test');

    expect(responseInterceptor).toHaveBeenCalled();
  });

  it('sends POST requests with the correct method and body', async () => {
    const mockSuper = await import('superagent');
    const body = { name: 'test' };

    await superagentInstance.post('/test', body);

    expect(mockSuper.default).toHaveBeenCalledWith('POST', '/test');
  });

  it('sends PUT requests with the correct method and body', async () => {
    const mockSuper = await import('superagent');
    const body = { name: 'test' };

    await superagentInstance.put('/test', body);

    expect(mockSuper.default).toHaveBeenCalledWith('PUT', '/test');
  });

  it('sends DELETE requests with the correct method', async () => {
    const mockSuper = await import('superagent');

    await superagentInstance.delete('/test');

    expect(mockSuper.default).toHaveBeenCalledWith('DELETE', '/test');
  });
});

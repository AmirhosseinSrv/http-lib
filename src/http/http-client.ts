import { AxiosHttpClient } from './axios';
import { FetchHttpClient } from './fetch/';
import { KyHttpClient } from './ky';
import { SuperAgentHttpClient } from './superagent';
import type { THttpClientProvider, THttpClient } from './types';

export default function getHttpClientInstance<T extends THttpClientProvider>(httpClientType: T): THttpClient<T> {
  switch (httpClientType) {
    case 'axios':
      return AxiosHttpClient.getInstance() as THttpClient<T>;
    case 'fetch':
      return FetchHttpClient.getInstance() as THttpClient<T>;
    case 'superagent':
      return SuperAgentHttpClient.getInstance() as THttpClient<T>;
    case 'ky':
      return KyHttpClient.getInstance() as THttpClient<T>;
    default:
      throw new Error('This provider is not supported.');
  }
}

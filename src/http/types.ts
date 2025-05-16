import { AxiosHttpClient } from './axios';
import { FetchHttpClient } from './fetch';
import { KyHttpClient } from './ky';
import { SuperAgentHttpClient } from './superagent';

export type THttpClientProvider = 'axios' | 'fetch' | 'superagent' | 'ky';

export type THttpClient<T extends THttpClientProvider> = {
  axios: AxiosHttpClient;
  fetch: FetchHttpClient;
  superagent: SuperAgentHttpClient;
  ky: KyHttpClient;
}[T];

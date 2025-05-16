import type { Options } from 'ky';

export type TRequestMethods = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type TRequestInterceptor = (
  url: string,
  options: Options
) => Promise<{ url: string; options: Options }> | { url: string; options: Options };
export type TResponseInterceptor = (response: Response) => Promise<Response> | Response;

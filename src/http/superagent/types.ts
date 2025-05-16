import type { Request, Response } from 'superagent';

export type TRequestMethods = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type TRequestInterceptor = (
  url: string,
  request: Request
) => Promise<{ url: string; request: Request }> | { url: string; request: Request };
export type TResponseInterceptor = (response: Response) => Promise<Response> | Response;

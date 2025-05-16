export type TRequestInterceptor = (
  url: string,
  options: RequestInit
) => { url: string; options: RequestInit } | Promise<{ url: string; options: RequestInit }>;
export type TResponseInterceptor = (response: Response) => Response | Promise<Response>;

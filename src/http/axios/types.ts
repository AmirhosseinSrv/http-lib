import { AxiosInterceptorManager, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

export type TRequestMethods = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type TRequestInterceptor = Parameters<AxiosInterceptorManager<InternalAxiosRequestConfig<unknown>>['use']>[0];
export type TResponseInterceptor = Parameters<AxiosInterceptorManager<AxiosResponse<unknown, unknown>>['use']>[0];

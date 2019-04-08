import { ResourceType } from 'puppeteer';

export interface RequestFilter {
    method?: string;
    path?: string;
}

export interface MockedResponse {
    status: number;
    headers?: Record<string, string>;
    body: any;
}

export interface InterceptedRequest {
    path: string;
    url: string;
    method: string;
    body?: any;
    rawBody?: string | undefined;
    headers: Record<string, string>;
    type: ResourceType;
}

export interface MockOptions {
    priority: number;
}

export interface IMock {
    getRequest(n: number): InterceptedRequest;
    getResponseForRequest(request: InterceptedRequest): MockedResponse | null;
}

import { ResourceType } from 'puppeteer';
import { UrlWithParsedQuery } from 'url';

export interface RequestFilter {
    method: string;
    url: string;
}

export interface MockedResponse {
    status: number;
    headers?: Record<string, string>;
    body: any;
}

export interface InterceptedRequest extends UrlWithParsedQuery {
    url: string;
    method: string;
    body?: any;
    rawBody?: string | undefined;
    headers: Record<string, string>;
    type: ResourceType;
}

export interface MockOptions {
    id: string | number;
    priority: number;
}

export interface IMock {
    getRequest(n: number): Promise<InterceptedRequest>;
    getResponseForRequest(
        request: InterceptedRequest,
        origin: string
    ): MockedResponse | null;
}

import { ResourceType } from 'puppeteer';

export interface RequestFilter {
    method: string;
    url: string;
}

export interface MockedResponse {
    status: number;
    headers?: Record<string, string>;
    body: any;
}

export interface MatchedRequest {
    url: string;
    method: string;
    body?: any;
    rawBody?: string | undefined;
    headers: Record<string, string>;
    type: ResourceType;
    path: string | undefined;
    query: Record<string, string | string[]>;
}

export interface MockOptions {
    priority: number;
}

export interface IMock {
    getRequest(n: number): Promise<MatchedRequest | undefined>;
    getResponseForRequest(
        request: MatchedRequest,
        origin: string
    ): MockedResponse | null;
}

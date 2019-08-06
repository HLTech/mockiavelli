import { ResourceType } from 'puppeteer';

export type QueryObject = Record<string, string | string[]>;

export interface RequestMethodFilter {
    url: string;
    query?: QueryObject;
}

export interface RequestFilter extends RequestMethodFilter {
    method: string;
}

export interface ParsedFilterRequest {
    method: string;
    hostname: string | undefined;
    path: string | undefined;
    query: QueryObject;
    pathParams: PathParameters;
    pathRegex: RegExp | undefined;
}

export interface MockedResponse {
    status: number;
    headers?: Record<string, string>;
    body: any;
}

export interface ReceivedRequest {
    url: string;
    method: string;
    hostname: string;
    body?: any;
    rawBody?: string | undefined;
    headers: Record<string, string>;
    type: ResourceType;
    path: string | undefined;
    query: QueryObject;
}

export type PathParameters = Record<string, string | number>;

export interface MatchedRequest extends ReceivedRequest {
    params: PathParameters;
}

export interface MockOptions {
    priority: number;
    once: boolean;
}

export interface IMock {
    getRequest(n: number): Promise<MatchedRequest | undefined>;
    getResponseForRequest(
        request: MatchedRequest,
        origin: string
    ): MockedResponse | null;
    options: MockOptions;
}

export enum REST_METHOD {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}

import { ResourceType } from 'puppeteer';

export type QueryObject = Record<string, string | string[]>;

export type RequestMatcher = RequestMatcherObject | string;

export interface RequestMatcherObject {
    method?: string;
    url: string;
    query?: QueryObject;
    body?: any;
}

export type RequestMatcherShort = Omit<RequestMatcherObject, 'method'> | string;

export type MockedResponse =
    | ((req: MatchedRequest) => MockedResponseObject)
    | MockedResponseObject;

export interface MockedResponseObject {
    status: number;
    headers?: Record<string, string>;
    body?: any;
}

export interface ReceivedRequest {
    url: string;
    method: string;
    hostname: string;
    body?: any;
    headers: Record<string, string>;
    type: ResourceType;
    path: string;
    query: QueryObject;
}

export type PathParameters = Record<string, string | number>;

export interface MatchedRequest {
    url: string;
    method: string;
    body?: any;
    headers: Record<string, string>;
    path: string;
    query: QueryObject;
    params: PathParameters;
}

export interface MockOptions {
    priority: number;
    once: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

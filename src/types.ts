import {ResourceType} from "puppeteer";

export interface RequestFilter {
    method?: string;
    path?: string;
}

export interface MockedResponse {
    status: number;
    body: any;
}

export interface InterceptedRequest {
    path: string;
    url: string;
    method: string;
    body: any;
    rawBody: string | undefined;
    headers: Record<string, string>;
    type: ResourceType;
}

export interface IMock {
    isMatchingRequest(request: InterceptedRequest): boolean;

    getRequest(n: number): InterceptedRequest;

    getResponseForRequest(request: InterceptedRequest): MockedResponse;
}
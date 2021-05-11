export type QueryObject = Record<string, string | string[] | undefined>;

export type URLString = string;

export type RequestMatcher = {
    method: MatcherHttpMethod;
    url: URLString;
    query?: QueryObject;
    body?: any;
};

export type ShorthandRequestMatcher = {
    url: URLString;
    query?: QueryObject;
    body?: any;
};

export type MockedResponse<TResponseBody = any> =
    | ((req: MatchedRequest) => MockedResponseObject<TResponseBody>)
    | MockedResponseObject<TResponseBody>;

export interface MockedResponseObject<TResponseBody = any> {
    status: number;
    headers?: Record<string, string>;
    body?: TResponseBody;
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

export type MatcherHttpMethod =
    | 'ALL'
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'PATCH';

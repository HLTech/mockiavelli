export type QueryObject = Record<string, string | string[]>;

export interface RequestMatcher {
    method: HttpMethod;
    url: string;
    query?: QueryObject;
    body?: any;
}

export type ShorthandRequestMatcher =
    | {
          url: string;
          query?: QueryObject;
          body?: any;
      }
    | string;

export type MockedResponse =
    | ((req: MatchedRequest) => MockedResponseObject)
    | MockedResponseObject;

export interface MockedResponseObject {
    status: number;
    headers?: Record<string, string>;
    body?: any;
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

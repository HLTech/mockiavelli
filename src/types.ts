export type QueryObject = Record<string, string | string[] | undefined>;

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

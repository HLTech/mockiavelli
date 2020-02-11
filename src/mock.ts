import dbg from 'debug';
import {
    MatchedRequest,
    MockedResponse,
    MockOptions,
    QueryObject,
    ReceivedRequest,
    MockedResponseObject,
    RequestMatcherObject,
    PathParameters,
} from './types';
import {
    waitFor,
    TimeoutError,
    nth,
    getCorsHeaders,
    sanitizeHeaders,
    requestToPlainObject,
    getRequestOrigin,
} from './utils';
import isEqual from 'lodash.isequal';
import { parse } from 'url';
import { stringify } from 'querystring';
import { Request } from 'puppeteer';
import { match, MatchFunction } from 'path-to-regexp';

const debug = dbg('mocketeer:rest');

const GET_REQUEST_TIMEOUT = 100;

let debugId = 1;

export class Mock {
    private filter: {
        method?: string;
        hostname: string | undefined;
        path: string;
        query: QueryObject;
        pathMatch: MatchFunction<PathParameters>;
        body: any;
    };
    private response: MockedResponse;
    private requests: Array<MatchedRequest> = [];
    private debugId = debugId++;
    public options: MockOptions = {
        priority: 0,
        once: false,
    };

    constructor(
        filter: RequestMatcherObject,
        response: MockedResponse,
        options: Partial<MockOptions> = {}
    ) {
        this.filter = this.createParsedFilterRequest(filter);
        this.response = response;
        this.options = { ...this.options, ...options };
        this.debug(
            '+',
            `created mock: method=${filter.method} url=${filter.url}`
        );
    }

    private debug(symbol: string, message: string): void {
        debug(`${symbol} (${this.debugId}) ${message} `);
    }

    private debugMiss(
        reason: string,
        requestValue: string,
        filterValue: string
    ) {
        this.debug(
            `·`,
            `${reason} not matched: mock=${filterValue} req=${requestValue} `
        );
    }

    public async getRequest(index: number = 0): Promise<MatchedRequest> {
        try {
            await waitFor(
                () => Boolean(this.requests[index]),
                GET_REQUEST_TIMEOUT
            );
        } catch (e) {
            if (e instanceof TimeoutError) {
                if (this.requests.length === 0 && index === 0) {
                    throw new Error(
                        `No request matching mock [${this.prettyPrint()}] found`
                    );
                } else {
                    throw new Error(
                        `${nth(
                            index + 1
                        )} request matching mock [${this.prettyPrint()}] was not found`
                    );
                }
            }
            throw e;
        }
        return this.requests[index];
    }

    public getResponseForRequest(
        request: Request
    ): MockedResponseObject | null {
        if (this.options.once && this.requests.length > 0) {
            this.debug('once', 'Request already matched');
            return null;
        }

        const serializedRequest = requestToPlainObject(request);
        const pageOrigin = getRequestOrigin(request);

        const matchedRequest = this.getRequestMatch(
            serializedRequest,
            pageOrigin
        );

        if (matchedRequest === null) {
            return null;
        }

        this.requests.push(matchedRequest);

        const response =
            typeof this.response === 'function'
                ? this.response(serializedRequest)
                : this.response;

        const status = response.status || 200;

        // Set default value of Content-Type header
        const headers = sanitizeHeaders({
            ['content-type']: `'application/json';charset=UTF-8`,
            ...getCorsHeaders(request),
            ...response.headers,
        });

        // Serialize JSON response
        const body =
            typeof response.body !== 'string'
                ? JSON.stringify(response.body)
                : response.body;

        return { status, headers, body };
    }

    private getRequestMatch(
        request: ReceivedRequest,
        pageOrigin: string
    ): MatchedRequest | null {
        if (this.filter.method && request.method !== this.filter.method) {
            this.debugMiss('method', request.method, this.filter.method);
            return null;
        }

        const filterRequestOrigin = this.filter.hostname || pageOrigin;

        if (filterRequestOrigin !== request.hostname) {
            this.debugMiss(
                'url',
                request.hostname || `Request origin missing`,
                filterRequestOrigin || `Filter origin missing`
            );
            return null;
        }

        const pathMatch = this.filter.pathMatch(request.path);

        if (!pathMatch) {
            this.debugMiss(
                'url',
                request.path || `Request path missing`,
                this.filter.path || `Filter path missing`
            );
            return null;
        }

        if (!this.requestParamsMatch(request.query, this.filter.query)) {
            this.debugMiss(
                'query',
                JSON.stringify(request.query),
                JSON.stringify(this.filter.query)
            );
            return null;
        }

        if (this.filter.body && !isEqual(request.body, this.filter.body)) {
            this.debugMiss(
                'body',
                JSON.stringify(request.body),
                JSON.stringify(this.filter.body)
            );
            return null;
        }

        this.debug('=', `matched mock`);

        return {
            ...request,
            params: pathMatch.params,
        };
    }

    private createParsedFilterRequest(filter: RequestMatcherObject) {
        // TODO find a better alternative for url.parse
        const { protocol, host, pathname = '', query } = parse(
            filter.url,
            true
        );
        const hasHostname = protocol && host;

        return {
            method: filter.method,
            hostname: hasHostname ? `${protocol}//${host}` : undefined,
            query: filter.query ? filter.query : query,
            path: pathname,
            pathMatch: match<PathParameters>(pathname),
            body: filter.body,
        };
    }

    private requestParamsMatch(
        requestQuery: QueryObject,
        filterQuery: QueryObject
    ): boolean {
        return Object.keys(filterQuery).every((key: string) => {
            return (
                key in requestQuery &&
                isEqual(filterQuery[key], requestQuery[key])
            );
        });
    }

    private prettyPrint(): string {
        const qs = stringify(this.filter.query);
        return `(${this.debugId}) ${this.filter.method} ${this.filter.path +
            (qs ? '?' + qs : '')}`;
    }
}

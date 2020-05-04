import dbg from 'debug';
import {
    MatchedRequest,
    MockedResponse,
    MockOptions,
    QueryObject,
    MockedResponseObject,
    RequestMatcher,
    PathParameters,
} from './types';
import { waitFor, TimeoutError, nth } from './utils';
import isEqual from 'lodash.isequal';
import { parse } from 'url';
import { stringify } from 'querystring';
import { match, MatchFunction } from 'path-to-regexp';
import { BrowserRequest } from './controllers/BrowserController';

const debug = dbg('mockiavelli:mock');

const GET_REQUEST_TIMEOUT = 100;

let debugId = 1;

export class Mock {
    private matcher: {
        method: string;
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
        matcher: RequestMatcher,
        response: MockedResponse,
        options: Partial<MockOptions> = {}
    ) {
        this.matcher = this.parseMatcher(matcher);
        this.response = response;
        this.options = { ...this.options, ...options };
        this.debug(
            '+',
            `created mock: method=${matcher.method} url=${matcher.url}`
        );
    }

    private debug(symbol: string, message: string): void {
        debug(`${symbol} (${this.debugId}) ${message} `);
    }

    private debugMiss(
        reason: string,
        requestValue: string,
        matcherValue: string
    ) {
        this.debug(
            `·`,
            `${reason} not matched: mock=${matcherValue} req=${requestValue} `
        );
    }

    public async waitForRequest(index: number = 0): Promise<MatchedRequest> {
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

    public async waitForRequestsCount(count: number): Promise<void> {
        try {
            await waitFor(
                () => this.requests.length === count,
                GET_REQUEST_TIMEOUT
            );
        } catch (e) {
            if (e instanceof TimeoutError) {
                throw new Error(
                    `Expected ${count} requests to match mock [${this.prettyPrint()}]. Instead ${
                        this.requests.length
                    } request were matched.`
                );
            }
            throw e;
        }
    }

    public getResponseForRequest(
        request: BrowserRequest
    ): MockedResponseObject | null {
        if (this.options.once && this.requests.length > 0) {
            this.debug('once', 'Request already matched');
            return null;
        }

        const matchedRequest = this.getRequestMatch(request);

        if (matchedRequest === null) {
            return null;
        }

        this.requests.push(matchedRequest);

        const response =
            typeof this.response === 'function'
                ? this.response(matchedRequest)
                : this.response;

        return response;
    }

    private getRequestMatch(request: BrowserRequest): MatchedRequest | null {
        if (request.method !== this.matcher.method) {
            this.debugMiss('method', request.method, this.matcher.method);
            return null;
        }

        const matcherOrigin = this.matcher.hostname || request.sourceOrigin;

        if (matcherOrigin !== request.hostname) {
            this.debugMiss(
                'url',
                request.hostname || `Request origin missing`,
                matcherOrigin || `Matcher origin missing`
            );
            return null;
        }

        const pathMatch = this.matcher.pathMatch(request.path);

        if (!pathMatch) {
            this.debugMiss(
                'url',
                request.path || `Request path missing`,
                this.matcher.path || `Matcher path missing`
            );
            return null;
        }

        if (!this.requestParamsMatch(request.query, this.matcher.query)) {
            this.debugMiss(
                'query',
                JSON.stringify(request.query),
                JSON.stringify(this.matcher.query)
            );
            return null;
        }

        if (this.matcher.body && !isEqual(request.body, this.matcher.body)) {
            this.debugMiss(
                'body',
                JSON.stringify(request.body),
                JSON.stringify(this.matcher.body)
            );
            return null;
        }

        this.debug('=', `matched mock`);

        return {
            url: request.url,
            path: request.path,
            query: request.query,
            method: request.method,
            body: request.body,
            headers: request.headers,
            params: pathMatch.params,
        };
    }

    private parseMatcher(matcher: RequestMatcher) {
        // TODO find a better alternative for url.parse
        const { protocol, host, pathname = '', query } = parse(
            matcher.url,
            true
        );
        const hasHostname = protocol && host;

        return {
            method: matcher.method,
            hostname: hasHostname ? `${protocol}//${host}` : undefined,
            query: matcher.query ? matcher.query : query,
            path: pathname,
            pathMatch: match<PathParameters>(pathname),
            body: matcher.body,
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
        const qs = stringify(this.matcher.query);
        return `(${this.debugId}) ${this.matcher.method || 'HTTP'} ${
            this.matcher.path + (qs ? '?' + qs : '')
        }`;
    }
}

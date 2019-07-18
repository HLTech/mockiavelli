import { ResourceType } from 'puppeteer';
import dbg from 'debug';
import {
    IMock,
    MatchedRequest,
    MockedResponse,
    MockOptions,
    ParsedFilterRequest,
    QueryObject,
    RequestFilter,
} from './types';
import { waitFor } from './utils';
import isEqual from 'lodash.isequal';
import { parse } from 'url';

const debug = dbg('mocketeer:rest');

let debugId = 1;

export class RestMock implements IMock {
    private filter: ParsedFilterRequest;
    private response: MockedResponse;
    private requests: Array<MatchedRequest> = [];
    private options: MockOptions = {
        priority: 0,
    };
    private debugId = debugId++;
    constructor(
        filter: RequestFilter,
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

    public async getRequest(
        n: number = 0
    ): Promise<MatchedRequest | undefined> {
        try {
            await waitFor(() => Boolean(this.requests[n]));
        } catch (e) {}
        return this.requests[n];
    }

    public getResponseForRequest(
        request: MatchedRequest,
        pageOrigin: string
    ): MockedResponse | null {
        if (!this.isMatchingRequest(request, pageOrigin)) {
            return null;
        }

        this.requests.push(request);
        return {
            status: this.response.status,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.response.body),
        };
    }

    private static allowedTypes: ResourceType[] = ['fetch', 'xhr'];

    private isMatchingRequest(
        request: MatchedRequest,
        pageOrigin: string
    ): boolean {
        if (RestMock.allowedTypes.indexOf(request.type) === -1) {
            this.debugMiss(
                'type',
                request.type,
                RestMock.allowedTypes.toString()
            );
            return false;
        }

        if (request.method !== this.filter.method) {
            this.debugMiss('method', request.method, this.filter.method);
            return false;
        }

        const filterRequestUrlToCompare = this.filter.hostname
            ? this.filter.hostname + this.filter.path
            : pageOrigin + this.filter.path;

        const requestUrlToCompare = request.hostname + request.path;

        if (filterRequestUrlToCompare !== requestUrlToCompare) {
            this.debugMiss(
                'url',
                requestUrlToCompare || `Request url missing`,
                filterRequestUrlToCompare || `Filter url missing`
            );
            return false;
        }

        if (!this.requestParamsMatch(request.query, this.filter.query)) {
            this.debugMiss(
                'query',
                JSON.stringify(request.query),
                JSON.stringify(this.filter.query)
            );
            return false;
        }

        this.debug('=', `matched mock`);

        return true;
    }

    private createParsedFilterRequest(
        filter: RequestFilter
    ): ParsedFilterRequest {
        // TODO find a better alternative for url.parse
        const { protocol, host, pathname, query } = parse(filter.url, true);
        const hasHostname = protocol && host;

        return {
            method: filter.method,
            hostname: hasHostname ? `${protocol}//${host}` : undefined,
            query: filter.query ? filter.query : query,
            path: pathname,
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

    public static sortByPriority(a: RestMock, b: RestMock) {
        return b.options.priority - a.options.priority;
    }
}

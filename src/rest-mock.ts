import { ResourceType } from 'puppeteer';
import dbg from 'debug';
import {
    IMock,
    RequestFilter,
    MockedResponse,
    MatchedRequest,
    MockOptions,
} from './types';
import { waitFor } from './utils';

const debug = dbg('mocketeer:rest');

let debugId = 1;

export class RestMock implements IMock {
    private filter: RequestFilter;
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
        this.filter = filter;
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
        origin: string
    ): MockedResponse | null {
        if (!this.isMatchingRequest(request, origin)) {
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
        origin: string
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

        if (this.filter.url.startsWith('/')) {
            if (origin + this.filter.url !== request.url) {
                this.debugMiss('url', request.url, origin + this.filter.url);
                return false;
            }
        } else {
            if (request.url !== this.filter.url) {
                this.debugMiss('url', request.url, this.filter.url);
                return false;
            }
        }

        this.debug('=', `matched mock`);

        return true;
    }

    public static sortByPriority(a: RestMock, b: RestMock) {
        return b.options.priority - a.options.priority;
    }
}

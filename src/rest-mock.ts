import { ResourceType } from 'puppeteer';
import dbg from 'debug';
import {
    IMock,
    RequestFilter,
    MockedResponse,
    InterceptedRequest,
    MockOptions,
} from './types';
import { waitFor } from './utils';

const debug = dbg('mocketeer:rest');

export class RestMock implements IMock {
    private requestFilter: RequestFilter;
    private mockedResponse: MockedResponse;
    private requests: Array<InterceptedRequest> = [];
    private options: MockOptions = {
        id: Math.ceil(Math.random() * 1000),
        priority: 0,
    };

    constructor(
        filter: RequestFilter,
        response: MockedResponse,
        options: Partial<MockOptions> = {}
    ) {
        this.requestFilter = filter;
        this.mockedResponse = response;
        this.options = { ...this.options, ...options };
        this.debug(
            '+',
            `created mock: method=${filter.method} url=${filter.url}`
        );
    }

    private debug(symbol: string, message: string): void {
        debug(`${symbol} (${this.options.id}) ${message} `);
    }

    private debugMiss(
        reason: string,
        requestValue: string,
        mockedValue: string
    ) {
        this.debug(
            `×`,
            `${reason} not matched: mock=${mockedValue} req=${requestValue} `
        );
    }

    public async getRequest(n: number = 0): Promise<InterceptedRequest> {
        try {
            await waitFor(() => Boolean(this.requests[n]));
        } catch (e) {}
        return this.requests[n];
    }

    public getResponseForRequest(
        request: InterceptedRequest,
        origin: string
    ): MockedResponse | null {
        if (!this.isMatchingRequest(request, origin)) {
            return null;
        }

        this.requests.push(request);
        return {
            status: this.mockedResponse.status,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(this.mockedResponse.body),
        };
    }

    private static allowedTypes: ResourceType[] = ['fetch', 'xhr'];

    private isMatchingRequest(
        request: InterceptedRequest,
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

        if (request.method !== this.requestFilter.method) {
            this.debugMiss('method', request.method, this.requestFilter.method);
            return false;
        }

        if (this.requestFilter.url.startsWith('/')) {
            if (origin + this.requestFilter.url !== request.url) {
                this.debugMiss(
                    'url',
                    request.url,
                    origin + this.requestFilter.url
                );
                return false;
            }
        } else {
            if (request.url !== this.requestFilter.url) {
                this.debugMiss('url', request.url, this.requestFilter.url);
                return false;
            }
        }

        this.debug('•', `matched`);

        return true;
    }

    public static sortByPriority(a: RestMock, b: RestMock) {
        return b.options.priority - a.options.priority;
    }
}

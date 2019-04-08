import { ResourceType } from 'puppeteer';
import {
    IMock,
    RequestFilter,
    MockedResponse,
    InterceptedRequest,
    MockOptions,
} from './types';
import { waitFor } from './utils';

export class HttpMock implements IMock {
    private requestFilter: RequestFilter = {};
    private mockedResponse: MockedResponse;
    private requests: Array<InterceptedRequest> = [];
    private options: MockOptions = {
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
    }

    public getRequest(requestN: number = 0): InterceptedRequest {
        return this.requests[requestN];
    }

    public getRequests(): InterceptedRequest[] {
        return [...this.requests];
    }

    public getResponseForRequest(
        request: InterceptedRequest
    ): MockedResponse | null {
        if (!this.isMatchingRequest(request)) {
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

    public waitForRequest(): Promise<void> {
        return waitFor(() => this.requests.length > 0);
    }

    private static allowedTypes: ResourceType[] = ['fetch', 'xhr'];

    private isMatchingRequest(request: InterceptedRequest): boolean {
        if (HttpMock.allowedTypes.indexOf(request.type) === -1) {
            return false;
        }

        if (request.method !== this.requestFilter.method) {
            return false;
        }

        if (request.path !== this.requestFilter.path) {
            return false;
        }

        return true;
    }

    public static sortByPriority(a: HttpMock, b: HttpMock) {
        return b.options.priority - a.options.priority;
    }
}

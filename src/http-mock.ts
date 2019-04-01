import {ResourceType} from "puppeteer";
import {IMock, RequestFilter, MockedResponse, InterceptedRequest} from "./types";

export class HttpMock implements IMock {

    private requestFilter: RequestFilter = {};
    private mockedResponse: MockedResponse;
    private requests: Array<InterceptedRequest> = [];

    constructor(filter: RequestFilter, response: MockedResponse) {
        this.requestFilter = filter;
        this.mockedResponse = response;
    }

    public isMatchingRequest(request: InterceptedRequest): boolean {
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

    public getRequest(requestN: number = 0): InterceptedRequest {
        return this.requests[requestN];
    }

    public getResponseForRequest(request: InterceptedRequest) {
        this.requests.push(request);
        return {
            status: this.mockedResponse.status,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.mockedResponse.body),
        };
    }

    private static allowedTypes: ResourceType[] = [
        'fetch',
        'xhr',
    ];
}
import {Page, Request, ResourceType} from "puppeteer";
import {HttpMock} from "./http-mock";
import {IMock, MockedResponse, RequestFilter} from "./types";
import {requestToPlainObject} from "./utils";

interface PuppeteerMockOptions {
    origin: string;
    interceptedTypes?: ResourceType[];
}

export class Mocketeer {

    private mocks: IMock[] = [];

    private origin: string;

    private interceptedTypes: ResourceType[];

    constructor({
                    origin = 'http://localhost:8080',
                    interceptedTypes = ['xhr', 'fetch', 'websocket', 'eventsource'],
                }: PuppeteerMockOptions) {
        this.origin = origin;
        this.interceptedTypes = interceptedTypes;
    }

    public async activate(page: Page): Promise<void> {
        await page.setRequestInterception(true);
        page.on('request', (request) => this.interceptor(request));
    }

    public add<T extends IMock>(mock: T): T {
        this.mocks.push(mock);
        return mock;
    }

    public addRestMock(requestFilter: RequestFilter, mockedResponse: MockedResponse): HttpMock {
        const mock = new HttpMock(requestFilter, mockedResponse);
        this.mocks.push(mock);
        return mock;
    }

    public async interceptor (request: Request): Promise<boolean> {

        const requestData = requestToPlainObject(request, this.origin);

        for (const mock of this.mocks) {
            const isMatched = mock.isMatchingRequest(requestData);

            if (isMatched) {
                await request.respond(mock.getResponseForRequest(requestData));
                return Promise.resolve(true);
            }
        }

        if (this.interceptedTypes.indexOf(request.resourceType()) === -1) {
            return Promise.resolve(false);
        }

        throw new Error(`Unexpected ${request.resourceType()} request ${request.method()} ${request.url()}`);

    };


}


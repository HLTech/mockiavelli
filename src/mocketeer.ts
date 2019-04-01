import {Page, Request, ResourceType} from "puppeteer";
import {HttpMock} from "./http-mock";
import {IMock, InterceptedRequest, MockedResponse, RequestFilter} from "./types";

interface PuppeteerMockOptions {
    origin: string;
    debug?: boolean;
    interceptedTypes?: ResourceType[];
}

export class Mocketeer {

    private mocks: IMock[] = [];

    private origin: string;
    private debug: boolean;

    private interceptedTypes: ResourceType[];

    constructor({
                    origin = 'http://localhost:8080',
                    debug = false,
                    interceptedTypes = ['xhr', 'fetch', 'websocket', 'eventsource'],
                }: PuppeteerMockOptions) {
        this.origin = origin;
        this.debug = debug;
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

    private log(msg: any): void {
        if (this.debug) {
            console.log('[MockManger]', msg);
        }
    }

    public async interceptor (request: Request): Promise<boolean> {

        this.log(`request ${request.resourceType()} ${request.method()} ${request.url()}`);

        const requestData = this.requestToPlainObject(request);

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

    private requestToPlainObject(request: Request): InterceptedRequest {
        return {
            url: request.url(),
            path: request.url().replace(this.origin, ''),
            method: request.method(),
            headers: request.headers(),
            type: request.resourceType()
        }
    }

}


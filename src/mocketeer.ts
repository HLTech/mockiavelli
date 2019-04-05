import {Page, Request, ResourceType} from "puppeteer";
import {HttpMock} from "./http-mock";
import {MockedResponse, MockOptions, RequestFilter} from "./types";
import {requestToPlainObject} from "./utils";

interface PuppeteerMockOptions {
    origin: string;
    interceptedTypes?: ResourceType[];
}

export class Mocketeer {

    private mocks: HttpMock[] = [];

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
        page.on('request', (request) => this.onRequest(request));
    }

    public addRestMock(requestFilter: RequestFilter, mockedResponse: MockedResponse, options?: MockOptions): HttpMock {
        const mock = new HttpMock(requestFilter, mockedResponse, options);
        this.mocks.push(mock);
        return mock;
    }

    public removeMock(mock: HttpMock): HttpMock | void {
        const index = this.mocks.indexOf(mock);
        if (index > -1) {
            return this.mocks.splice(index, 1)[0];
        }
    }

    private async onRequest (request: Request): Promise<void> {

        const requestData = requestToPlainObject(request, this.origin);

        const sortedMocked = this.mocks.sort(HttpMock.sortByPriority);

        for (const mock of sortedMocked) {
            const response = mock.getResponseForRequest(requestData);

            if (response) {
                await request.respond(response);
                return;
            }
        }

        if (this.interceptedTypes.indexOf(request.resourceType()) > -1) {
            console.error(`Unexpected ${request.resourceType()} request ${request.method()} ${request.url()}`);
        }

    };

}


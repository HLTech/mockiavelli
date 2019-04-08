import { parse } from 'url';
import { Page, Request, ResourceType } from 'puppeteer';
import { HttpMock } from './http-mock';
import { MockedResponse, MockOptions, RequestFilter } from './types';
import { printRequest, requestToPlainObject } from './utils';

const interceptedTypes: ResourceType[] = ['xhr', 'fetch'];

export class Mocketeer {
    private mocks: HttpMock[] = [];

    public async activate(page: Page): Promise<void> {
        await page.setRequestInterception(true);
        page.on('request', request => this.onRequest(request));
    }

    public addRestMock(
        requestFilter: RequestFilter,
        mockedResponse: MockedResponse,
        options?: Partial<MockOptions>
    ): HttpMock {
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

    private async onRequest(request: Request): Promise<void> {
        // Do not intercept non xhr/fetch requests
        if (interceptedTypes.indexOf(request.resourceType()) === -1) {
            try {
                return await request.continue();
            } catch (e) {
                // Request could be already handled so ignore this error
                return;
            }
        }

        // Serialize request
        const requestData = requestToPlainObject(request);

        // Obtain request url from originating frame url
        const originFrame = request.frame();
        const originFrameUrl = originFrame ? await originFrame.url() : '';
        const { protocol, host } = parse(originFrameUrl);
        const origin = `${protocol}//${host}`;

        for (const mock of this.mocks.sort(HttpMock.sortByPriority)) {
            const response = mock.getResponseForRequest(requestData, origin);

            if (response) {
                try {
                    return await request.respond(response);
                } catch (e) {
                    console.error(
                        `Failed to reply with mocked response for ${printRequest(
                            request
                        )}`
                    );
                    console.error(e);
                    throw e;
                }
            }
        }

        // Request was not matched - log error and return 404
        console.error(`Mock not found for request: ${printRequest(request)}`);
        return request.respond({
            status: 404,
            body: 'No mock provided for request',
        });
    }
}

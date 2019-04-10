import { parse } from 'url';
import { Page, Request, ResourceType } from 'puppeteer';
import dbg from 'debug';
import { RestMock } from './rest-mock';
import { MockedResponse, MockOptions, RequestFilter } from './types';
import { printRequest, requestToPlainObject } from './utils';

const interceptedTypes: ResourceType[] = ['xhr', 'fetch'];

const debug = dbg('mocketeer:main');

export interface MocketeerOptions {
    debug: boolean;
}

export class Mocketeer {
    private mocks: RestMock[] = [];

    constructor(options: Partial<MocketeerOptions> = {}) {
        if (options.debug) {
            dbg.enable('mocketeer:*');
        }
        debug('Initialized');
    }
    public async activate(page: Page): Promise<void> {
        await page.setRequestInterception(true);
        page.on('request', request => this.onRequest(request));
    }

    public addRestMock(
        requestFilter: RequestFilter,
        mockedResponse: MockedResponse,
        options?: Partial<MockOptions>
    ): RestMock {
        const mock = new RestMock(requestFilter, mockedResponse, {
            ...options,
            id: this.mocks.length + 1,
        });
        // debug(`Add rest mock ${requestFilter.method} ${requestFilter.url} ${mockedResponse.status} ${mockedResponse.headers || '{}' } ${JSON.stringify(mockedResponse.body)}`)
        this.mocks.push(mock);
        return mock;
    }

    public removeMock(mock: RestMock): RestMock | void {
        const index = this.mocks.indexOf(mock);
        if (index > -1) {
            return this.mocks.splice(index, 1)[0];
        }
    }

    private async onRequest(request: Request): Promise<void> {
        // Do not intercept non xhr/fetch requests
        if (interceptedTypes.indexOf(request.resourceType()) === -1) {
            debug(`○ Unsupported type ${request.resourceType()}. Skipping`);
            try {
                return await request.continue();
            } catch (e) {
                // Request could be already handled so ignore this error
                return;
            }
        }

        // Serialize request
        const requestData = requestToPlainObject(request);

        debug(
            `> request: method=${requestData.method} url=${
                requestData.url
            } type=${requestData.type}`
        );

        // Obtain request url from originating frame url
        const originFrame = request.frame();
        const originFrameUrl = originFrame ? await originFrame.url() : '';
        const { protocol, host } = parse(originFrameUrl);
        const origin = `${protocol}//${host}`;

        for (const mock of this.mocks.sort(RestMock.sortByPriority)) {
            const response = mock.getResponseForRequest(requestData, origin);

            if (response) {
                try {
                    debug(
                        `< replying: status=${
                            response.status
                        } headers=${JSON.stringify(response.headers)} body=${
                            response.body
                        }`
                    );
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

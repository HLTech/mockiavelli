import { parse } from 'url';
import { Page, Request, ResourceType } from 'puppeteer';
import dbg from 'debug';
import { RestMock } from './rest-mock';
import {
    MockedResponse,
    MockOptions,
    RequestFilter,
    RequestMethodFilter,
    REST_METHOD,
} from './types';
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

    public static async setup(
        page: Page,
        options: Partial<MocketeerOptions> = {}
    ): Promise<Mocketeer> {
        const mocketeer = new Mocketeer(options);
        await mocketeer.activate(page);
        return mocketeer;
    }

    /**
     * use Mocketeer.setup instead
     * @deprecated
     */
    public async activate(page: Page): Promise<void> {
        await page.setRequestInterception(true);
        page.on('request', request => this.onRequest(request));
    }

    /*
     * Use mockREST instead
     * @deprecated
     */
    public addRestMock(
        filter: RequestFilter,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): RestMock {
        const mock = new RestMock(filter, response, {
            ...options,
        });
        this.mocks.push(mock);
        return mock;
    }

    public mockREST(
        filter: RequestFilter,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): RestMock {
        const mock = new RestMock(filter, response, {
            ...options,
        });
        this.mocks.push(mock);
        return mock;
    }

    public mockGET(
        filter: RequestMethodFilter | string,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): RestMock {
        const filterObject =
            typeof filter === 'string' ? { url: filter } : filter;

        return this.mockREST(
            { ...filterObject, method: REST_METHOD.GET },
            response,
            options
        );
    }

    public mockPOST(
        filter: RequestMethodFilter | string,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): RestMock {
        const filterObject =
            typeof filter === 'string' ? { url: filter } : filter;

        return this.mockREST(
            { ...filterObject, method: REST_METHOD.POST },
            response,
            options
        );
    }

    public mockPUT(
        filter: RequestMethodFilter | string,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): RestMock {
        const filterObject =
            typeof filter === 'string' ? { url: filter } : filter;

        return this.mockREST(
            { ...filterObject, method: REST_METHOD.PUT },
            response,
            options
        );
    }

    public mockDELETE(
        filter: RequestMethodFilter | string,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): RestMock {
        const filterObject =
            typeof filter === 'string' ? { url: filter } : filter;

        return this.mockREST(
            { ...filterObject, method: REST_METHOD.DELETE },
            response,
            options
        );
    }

    public removeMock(mock: RestMock): RestMock | void {
        const index = this.mocks.indexOf(mock);
        if (index > -1) {
            return this.mocks.splice(index, 1)[0];
        }
    }

    private async onRequest(request: Request): Promise<void> {
        // Serialize request
        const requestData = requestToPlainObject(request);
        const typeMatch =
            interceptedTypes.indexOf(request.resourceType()) !== -1;

        debug(
            `> req: type=${requestData.type} method=${requestData.method} url=${
                requestData.url
            } `
        );

        // Do not intercept non xhr/fetch requests
        if (!typeMatch) {
            debug(`< res: continue`);
            try {
                return await request.continue();
            } catch (e) {
                // Request could be already handled so ignore this error
                return;
            }
        }

        // Obtain request url from originating frame url
        const originFrame = request.frame();
        const originFrameUrl = originFrame ? await originFrame.url() : '';
        // TODO find a better alternative for url.parse
        const { protocol, host } = parse(originFrameUrl);
        const origin = `${protocol}//${host}`;

        for (const mock of this.mocks.sort(RestMock.sortByPriority)) {
            const response = mock.getResponseForRequest(requestData, origin);

            if (response) {
                try {
                    debug(
                        `< res: status=${
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
        debug(`< res: status=404`);
        console.error(`Mock not found for request: ${printRequest(request)}`);
        return request.respond({
            status: 404,
            body: 'No mock provided for request',
        });
    }
}

import { Page, Request, ResourceType } from 'puppeteer';
import dbg from 'debug';
import { Mock } from './mock';
import {
    MockedResponse,
    MockOptions,
    RequestMatcher,
    RequestMatcherShort,
} from './types';
import {
    addMockByPriority,
    printRequest,
    createRequestFilter,
    getCorsHeaders,
    sanitizeHeaders,
    printResponse,
} from './utils';

const interceptedTypes: ResourceType[] = ['xhr', 'fetch'];

const debug = dbg('mocketeer:main');

export interface MocketeerOptions {
    debug: boolean;
}

export class Mocketeer {
    private mocks: Mock[] = [];

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

    private async activate(page: Page): Promise<void> {
        await page.setRequestInterception(true);
        page.on('request', request => this.onRequest(request));
    }

    public mock(
        filter: RequestMatcher,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        const filterObject = createRequestFilter(filter);
        const mock = new Mock(filterObject, response, { ...options });
        addMockByPriority(this.mocks, mock);
        return mock;
    }

    public mockGET(
        filter: RequestMatcherShort,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        return this.mock(createRequestFilter(filter, 'GET'), response, options);
    }

    public mockPOST(
        filter: RequestMatcherShort,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        return this.mock(
            createRequestFilter(filter, 'POST'),
            response,
            options
        );
    }

    public mockPUT(
        filter: RequestMatcherShort,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        return this.mock(createRequestFilter(filter, 'PUT'), response, options);
    }

    public mockDELETE(
        filter: RequestMatcherShort,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        return this.mock(
            createRequestFilter(filter, 'DELETE'),
            response,
            options
        );
    }

    public mockPATCH(
        filter: RequestMatcherShort,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        return this.mock(
            createRequestFilter(filter, 'PATCH'),
            response,
            options
        );
    }

    public removeMock(mock: Mock): Mock | void {
        const index = this.mocks.indexOf(mock);
        if (index > -1) {
            return this.mocks.splice(index, 1)[0];
        }
    }

    private async onRequest(request: Request): Promise<void> {
        // Serialize request
        const should404 =
            interceptedTypes.indexOf(request.resourceType()) !== -1;

        debug(`> req: ${printRequest(request)} `);

        // Handle preflight requests
        if (request.method() === 'OPTIONS') {
            return await request.respond({
                status: 204,
                headers: sanitizeHeaders(getCorsHeaders(request)),
            });
        }

        for (const mock of this.mocks) {
            const response = mock.getResponseForRequest(request);

            if (response) {
                const status = response.status || 200;

                // Convert response body to Buffer.
                // A bug in puppeteer causes stalled response when body is equal to "" or undefined.
                // Providing response as Buffer fixes it.
                let body: Buffer;
                if (typeof response.body === 'string') {
                    body = Buffer.from(response.body);
                } else if (
                    response.body === undefined ||
                    response.body === null
                ) {
                    body = Buffer.alloc(0);
                } else {
                    try {
                        body = Buffer.from(JSON.stringify(response.body));
                    } catch (e) {
                        // Response body in either not JSON-serializable or something else
                        // that cannot be handled. In this case we throw an error
                        console.error('Could not serialize response body', e);
                        throw e;
                    }
                }

                // Set default value of Content-Type header
                const headers = sanitizeHeaders({
                    'content-length': String(body.length),
                    'content-type':
                        body.length > 0
                            ? `application/json; charset=utf-8`
                            : '',
                    ...getCorsHeaders(request),
                    ...response.headers,
                });

                try {
                    await request.respond({
                        status,
                        headers,
                        body,
                    });
                    debug(`< res: ${printResponse(status, headers, body)}`);
                    return;
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
        if (should404) {
            debug(`< res: status=404`);
            console.error(
                `Mock not found for request: ${printRequest(request)}`
            );
            return request.respond({
                status: 404,
                body: 'No mock provided for request',
            });
        }

        // Do not intercept non xhr/fetch requests
        debug(`< res: continue`);
        try {
            return await request.continue();
        } catch (e) {
            console.error(e);
            // Request could be already handled so ignore this error
            return;
        }
    }
}

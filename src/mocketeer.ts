import dbg from 'debug';
import { Mock } from './mock';
import {
    MockedResponse,
    MockOptions,
    RequestMatcher,
    ShorthandRequestMatcher,
} from './types';
import {
    addMockByPriority,
    printRequest,
    createRequestMatcher,
    getCorsHeaders,
    sanitizeHeaders,
    printResponse,
} from './utils';
import {
    BrowserController,
    BrowserRequestHandler,
    BrowserRequestType,
} from './controllers/BrowserController';
import {
    BrowserPage,
    BrowserControllerFactory,
} from './controllers/BrowserControllerFactory';

const debug = dbg('mocketeer:main');

const interceptedTypes: BrowserRequestType[] = ['xhr', 'fetch'];

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
        page: BrowserPage,
        options: Partial<MocketeerOptions> = {}
    ): Promise<Mocketeer> {
        const mocketeer = new Mocketeer(options);
        const controller = BrowserControllerFactory.createForPage(page);
        await mocketeer.activate(controller);
        return mocketeer;
    }

    private async activate(controller: BrowserController): Promise<void> {
        await controller.startInterception(this.onRequest);
    }

    public mock(
        matcher: RequestMatcher,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        const mock = new Mock(matcher, response, { ...options });
        addMockByPriority(this.mocks, mock);
        return mock;
    }

    public mockGET(
        matcher: ShorthandRequestMatcher,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        return this.mock(
            createRequestMatcher(matcher, 'GET'),
            response,
            options
        );
    }

    public mockPOST(
        matcher: ShorthandRequestMatcher,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        return this.mock(
            createRequestMatcher(matcher, 'POST'),
            response,
            options
        );
    }

    public mockPUT(
        matcher: ShorthandRequestMatcher,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        return this.mock(
            createRequestMatcher(matcher, 'PUT'),
            response,
            options
        );
    }

    public mockDELETE(
        matcher: ShorthandRequestMatcher,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        return this.mock(
            createRequestMatcher(matcher, 'DELETE'),
            response,
            options
        );
    }

    public mockPATCH(
        matcher: ShorthandRequestMatcher,
        response: MockedResponse,
        options?: Partial<MockOptions>
    ): Mock {
        return this.mock(
            createRequestMatcher(matcher, 'PATCH'),
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

    private onRequest: BrowserRequestHandler = async (
        request,
        respond,
        skip
    ): Promise<void> => {
        debug(`> req: ${printRequest(request)} `);

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return await respond({
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
                let contentType: string | undefined;

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
                        contentType = 'application/json; charset=utf-8';
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
                    'content-type': contentType,
                    ...getCorsHeaders(request),
                    ...response.headers,
                });

                try {
                    await respond({
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

        const should404 = interceptedTypes.includes(request.type);

        // Request was not matched - log error and return 404
        if (should404) {
            debug(`< res: status=404`);
            console.error(
                `Mock not found for request: ${printRequest(request)}`
            );
            return respond({
                status: 404,
                body: 'No mock provided for request',
            });
        }

        // Do not intercept non xhr/fetch requests
        debug(`< res: continue`);
        try {
            return await skip();
        } catch (e) {
            console.error(e);
            // Request could be already handled so ignore this error
            return;
        }
    };
}

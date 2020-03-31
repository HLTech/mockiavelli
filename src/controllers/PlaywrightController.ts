import playwright from 'playwright';
import {
    BrowserController,
    BrowserRequestHandler,
    ResponseData,
    BrowserRequest,
    BrowserRequestType,
} from './BrowserController';
import { tryJsonParse } from '../utils';
import { parse } from 'url';

export class PlaywrightController implements BrowserController {
    constructor(private readonly page: playwright.Page) {}

    async startInterception(onRequest: BrowserRequestHandler) {
        this.page.route('**/*', (request: playwright.Request) => {
            onRequest(
                this.toBrowserRequest(request),
                data => this.respond(request, data),
                () => request.continue()
            );
        });
    }

    private toBrowserRequest(request: playwright.Request): BrowserRequest {
        // TODO find a better alternative for url.parse
        const { pathname = '', query, protocol, host } = parse(
            request.url(),
            true
        );

        return {
            type: request.resourceType() as BrowserRequestType,
            url: request.url(),
            body: tryJsonParse(request.postData()),
            method: request.method(),
            headers: request.headers() || {},
            path: pathname,
            hostname: `${protocol}//${host}`,
            query: query,
            sourceOrigin: this.getRequestOrigin(request),
        };
    }

    private async respond(request: playwright.Request, response: ResponseData) {
        await request.fulfill({
            headers: response.headers || {},
            status: response.status,
            body: response.body ? response.body : '',
            contentType: response.headers
                ? response.headers['content-type']
                : 'application/json',
        });
    }

    /**
     * Obtain request origin url from originating frame url
     */
    private getRequestOrigin(request: playwright.Request) {
        const originFrame = request.frame();
        const originFrameUrl = originFrame ? originFrame.url() : '';
        const { protocol, host } = parse(originFrameUrl);
        return `${protocol}//${host}`;
    }
}

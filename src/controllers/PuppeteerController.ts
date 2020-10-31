import { Page, Request } from 'puppeteer';
import { parse } from 'url';
import {
    BrowserController,
    BrowserRequest,
    BrowserRequestHandler,
} from './BrowserController';
import { getOrigin, tryJsonParse } from '../utils';

export class PuppeteerController implements BrowserController {
    constructor(
        private readonly page: Page,
        private readonly onRequest: BrowserRequestHandler
    ) {}

    public async startInterception() {
        await this.page.setRequestInterception(true);
        await this.page.on('request', this.requestHandler);
    }

    public async stopInterception() {
        await this.page.setRequestInterception(false);
        await this.page.off('request', this.requestHandler);
    }

    private requestHandler = (request: Request) => {
        this.onRequest(
            this.toBrowserRequest(request),
            (response) => request.respond(response),
            () => request.continue()
        );
    };

    private toBrowserRequest(request: Request): BrowserRequest {
        // TODO find a better alternative for url.parse
        const { pathname, query, protocol, host } = parse(request.url(), true);

        return {
            type: request.resourceType(),
            url: request.url(),
            body: tryJsonParse(request.postData()),
            method: request.method(),
            headers: request.headers() || {},
            path: pathname ?? '',
            hostname: `${protocol}//${host}`,
            query: query,
            sourceOrigin: this.getRequestOrigin(request),
        };
    }

    /**
     * Obtain request origin url from originating frame url
     */
    private getRequestOrigin(request: Request) {
        return getOrigin(request.frame()?.url());
    }
}

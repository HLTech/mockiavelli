import { Page, Request } from 'puppeteer';
import { parse } from 'url';
import {
    BrowserController,
    BrowserRequest,
    BrowserRequestHandler,
} from './BrowserController';
import { tryJsonParse } from '../utils';

export class PuppeteerController implements BrowserController {
    constructor(private readonly page: Page) {}

    async startInterception(onRequest: BrowserRequestHandler) {
        await this.page.setRequestInterception(true);
        this.page.on('request', request => {
            onRequest(
                this.getRequestData(request),
                response => request.respond(response),
                () => request.continue()
            );
        });
    }

    private getRequestData(request: Request): BrowserRequest {
        // TODO find a better alternative for url.parse
        const { pathname = '', query, protocol, host } = parse(
            request.url(),
            true
        );

        return {
            type: request.resourceType(),
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

    /**
     * Obtain request origin url from originating frame url
     */
    private getRequestOrigin(request: Request) {
        const originFrame = request.frame();
        const originFrameUrl = originFrame ? originFrame.url() : '';
        const { protocol, host } = parse(originFrameUrl);
        return `${protocol}//${host}`;
    }
}

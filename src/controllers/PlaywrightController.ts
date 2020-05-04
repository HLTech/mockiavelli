import playwright from 'playwright-core';
import {
    BrowserController,
    BrowserRequestHandler,
    ResponseData,
    BrowserRequest,
    BrowserRequestType,
} from './BrowserController';
import { getOrigin, tryJsonParse } from '../utils';
import { parse } from 'url';

export class PlaywrightController implements BrowserController {
    constructor(private readonly page: playwright.Page) {}

    async startInterception(onRequest: BrowserRequestHandler) {
        this.page.route('**/*', (route: playwright.Route) => {
            onRequest(
                this.toBrowserRequest(route.request()),
                (data) => this.respond(route, data),
                () => this.skip(route)
            );
        });
    }

    private toBrowserRequest(request: playwright.Request): BrowserRequest {
        // TODO find a better alternative for url.parse
        const { pathname, query, protocol, host } = parse(request.url(), true);

        return {
            type: request.resourceType() as BrowserRequestType,
            url: request.url(),
            body: tryJsonParse(request.postData()),
            method: request.method(),
            headers: (request.headers() as Record<string, string>) || {},
            path: pathname ?? '',
            hostname: `${protocol}//${host}`,
            query: query,
            sourceOrigin: this.getRequestOrigin(request),
        };
    }

    private async respond(route: playwright.Route, response: ResponseData) {
        await route.fulfill({
            headers: response.headers || {},
            status: response.status,
            body: response.body ? response.body : '',
            contentType: response.headers?.['content-type'],
        });
    }

    private async skip(route: playwright.Route) {
        await route.continue();
    }

    /**
     * Obtain request origin url from originating frame url
     */
    private getRequestOrigin(request: playwright.Request): string {
        return getOrigin(request.frame().url());
    }
}

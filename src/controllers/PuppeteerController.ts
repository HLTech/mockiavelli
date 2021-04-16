import { parse } from 'url';
import {
    BrowserController,
    BrowserRequest,
    BrowserRequestHandler,
} from './BrowserController';
import { getOrigin, tryJsonParse } from '../utils';

export class PuppeteerController implements BrowserController {
    constructor(private readonly page: PuppeteerPage) {}

    async startInterception(onRequest: BrowserRequestHandler) {
        await this.page.setRequestInterception(true);
        this.page.on('request', (request) => {
            onRequest(
                this.toBrowserRequest(request),
                (response) => request.respond(response),
                () => request.continue()
            );
        });
    }

    private toBrowserRequest(request: PuppeteerRequest): BrowserRequest {
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
    private getRequestOrigin(request: PuppeteerRequest) {
        return getOrigin(request.frame()?.url());
    }
}

/**
 * Mirror of puppeteer Page interface
 */
export interface PuppeteerPage {
    setRequestInterception(enabled: boolean): Promise<void>;
    on(eventName: 'request', handler: (e: PuppeteerRequest) => void): any;
}

/**
 * Mirror of puppeteer Request interface
 */
export interface PuppeteerRequest {
    continue(): Promise<void>;
    frame(): {
        url(): string;
    } | null;
    headers(): Record<string, string>;
    method(): 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'OPTIONS';
    postData(): string | undefined;
    resourceType():
        | 'document'
        | 'stylesheet'
        | 'image'
        | 'media'
        | 'font'
        | 'script'
        | 'texttrack'
        | 'xhr'
        | 'fetch'
        | 'eventsource'
        | 'websocket'
        | 'manifest'
        | 'other';
    respond(response: PuppeteerRespondOptions): Promise<void>;
    url(): string;
}

/**
 * Mirror of puppeteer Response interface
 */
interface PuppeteerRespondOptions {
    status?: number;
    headers?: Record<string, string>;
    contentType?: string;
    body?: Buffer | string;
}

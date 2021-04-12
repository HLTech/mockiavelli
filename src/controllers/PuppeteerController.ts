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
interface PuppeteerRequest {
    /**
     * Continues request with optional request overrides.
     * To use this, request interception should be enabled with `page.setRequestInterception`.
     * @throws An exception is immediately thrown if the request interception is not enabled.
     */
    continue(): Promise<void>;

    /**
     * @returns The `Frame` object that initiated the request, or `null` if navigating to error pages
     */
    frame(): {
        url(): string;
    } | null;

    /**
     * An object with HTTP headers associated with the request.
     * All header names are lower-case.
     */
    headers(): Record<string, string>;

    /** Returns the request's method (GET, POST, etc.) */

    method(): 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'OPTIONS';

    /** Contains the request's post body, if any. */
    postData(): string | undefined;

    /** Contains the request's resource type as it was perceived by the rendering engine.  */
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

    /**
     * Fulfills request with given response.
     * To use this, request interception should be enabled with `page.setRequestInterception`.
     * @throws An exception is immediately thrown if the request interception is not enabled.
     * @param response The response options that will fulfill this request.
     */
    respond(response: PuppeteerRespondOptions): Promise<void>;

    /** Contains the URL of the request. */
    url(): string;
}

/**
 * Mirror of puppeteer Response interface
 */
interface PuppeteerRespondOptions {
    /**
     * Specifies the response status code.
     * @default 200
     */
    status?: number;
    /** Specifies the response headers. */
    headers?: Record<string, string>;
    /** Specifies the Content-Type response header. */
    contentType?: string;
    /** Specifies the response body. */
    body?: Buffer | string;
}

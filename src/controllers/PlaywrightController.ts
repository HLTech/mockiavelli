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
    constructor(private readonly page: PlaywrightPage) {}

    async startInterception(onRequest: BrowserRequestHandler) {
        await this.page.route('**/*', (route: PlaywrightRoute) => {
            onRequest(
                this.toBrowserRequest(route.request()),
                (data) => this.respond(route, data),
                () => this.skip(route)
            );
        });
    }

    private toBrowserRequest(request: PlaywrightRequest): BrowserRequest {
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

    private async respond(route: PlaywrightRoute, response: ResponseData) {
        await route.fulfill({
            headers: response.headers || {},
            status: response.status,
            body: response.body ? response.body : '',
            contentType: response.headers?.['content-type'],
        });
    }

    private async skip(route: PlaywrightRoute) {
        await route.continue();
    }

    /**
     * Obtain request origin url from originating frame url
     */
    private getRequestOrigin(request: PlaywrightRequest): string {
        return getOrigin(request.frame().url());
    }
}

/**
 * Mirror of playwright's Page interface
 */
export interface PlaywrightPage {
    route(
        url: string,
        handler: (route: PlaywrightRoute, request: PlaywrightRequest) => void
    ): Promise<void>;
}

/**
 * Mirror of playwright's Route interface
 */
interface PlaywrightRoute {
    fulfill(response: PlaywrightRouteFulfillResponse): Promise<void>;
    request(): PlaywrightRequest;
    continue(): Promise<void>;
}

/**
 * Mirror of playwright's Response interface
 */
interface PlaywrightRouteFulfillResponse {
    /**
     * Response status code, defaults to `200`.
     */
    status?: number;

    /**
     * Optional response headers. Header values will be converted to a string.
     */
    headers?: { [key: string]: string };

    /**
     * If set, equals to setting `Content-Type` response header.
     */
    contentType?: string;

    /**
     * Optional response body.
     */
    body?: string | Buffer;

    /**
     * Optional file path to respond with. The content type will be inferred from file extension. If `path` is a relative path, then it is resolved relative to current working directory.
     */
    path?: string;
}

/**
 * Mirror of playwright's Request interface
 */
export interface PlaywrightRequest {
    /**
     * @returns A Frame that initiated this request.
     */
    frame(): {
        url(): string;
    };

    /**
     * @returns An object with HTTP headers associated with the request. All header names are lower-case.
     */
    headers(): { [key: string]: string };

    /**
     * @returns Request's method (GET, POST, etc.)
     */
    method(): string;

    /**
     * @returns Request's post body, if any.
     */
    postData(): null | string;

    /**
     * Contains the request's resource type as it was perceived by the rendering engine.
     * ResourceType will be one of the following: `document`, `stylesheet`, `image`, `media`, `font`, `script`, `texttrack`, `xhr`, `fetch`, `eventsource`, `websocket`, `manifest`, `other`.
     */
    resourceType(): string;

    /**
     * @returns URL of the request.
     */
    url(): string;
}

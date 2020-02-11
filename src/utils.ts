import { parse } from 'url';
import { Request, Headers } from 'puppeteer';
import {
    HttpMethod,
    ReceivedRequest,
    RequestMatcher,
    ShorthandRequestMatcher,
} from './types';

export function requestToPlainObject(request: Request): ReceivedRequest {
    const url = request.url();
    // TODO find a better alternative for url.parse
    const { pathname = '', query, protocol, host } = parse(url, true);
    return {
        url,
        body: toJson(request.postData()),
        method: request.method(),
        headers: request.headers(),
        type: request.resourceType(),
        path: pathname,
        hostname: `${protocol}//${host}`,
        query,
    };
}

function toJson(data: string | undefined): any | undefined {
    if (!data) {
        return;
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        return data;
    }
}

export class TimeoutError extends Error {}

export function waitFor(fn: () => boolean, timeout = 100): Promise<void> {
    const timeStart = Date.now();
    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            if (fn()) {
                clearInterval(intervalId);
                return resolve();
            } else if (Date.now() - timeStart > timeout) {
                clearInterval(intervalId);
                return reject(
                    new TimeoutError(
                        `waitFor timeout - provided function did not return true in ${timeout}ms`
                    )
                );
            }
        });
    });
}

export function printRequest(request: Request): string {
    return `type=${request.resourceType()} method=${request.method() ||
        ''} url=${request.url() || ''}`;
}

export function nth(d: number): string {
    if (d > 3 && d < 21) return `${d}th`;
    switch (d % 10) {
        case 1:
            return `${d}st`;
        case 2:
            return `${d}nd`;
        case 3:
            return `${d}rd`;
        default:
            return `${d}th`;
    }
}

export function addMockByPriority<T extends { options: { priority: number } }>(
    mockArr: T[],
    mock: T
) {
    const index = mockArr.findIndex(
        (item: T) => item.options.priority <= mock.options.priority
    );
    const calculatedIndex = index === -1 ? mockArr.length : index;
    mockArr.splice(calculatedIndex, 0, mock);
    return mockArr;
}

export function createRequestMatcher(
    input: ShorthandRequestMatcher,
    method: HttpMethod
): RequestMatcher {
    if (typeof input === 'string') {
        return {
            method,
            url: input,
        };
    } else {
        return {
            method,
            ...input,
        };
    }
}

export function getCorsHeaders(request: Request) {
    const requestHeaders = request.headers();
    const origin = getRequestOrigin(request);
    const headers: Headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods':
            requestHeaders['access-control-request-method'],
        'Access-Control-Allow-Headers':
            requestHeaders['access-control-request-headers'],
    };

    return headers;
}

/**
 * Obtain request origin url from originating frame url
 * @param request
 */
export function getRequestOrigin(request: Request) {
    const originFrame = request.frame();
    const originFrameUrl = originFrame ? originFrame.url() : '';
    // TODO find a better alternative for url.parse
    const { protocol, host } = parse(originFrameUrl);
    return `${protocol}//${host}`;
}

/**
 * Sanitize headers object from empty or null values
 * because they make request hang indefinitely in puppeteer
 */
export function sanitizeHeaders(headers: Headers): Headers {
    return Object.keys(headers).reduce<Headers>((acc, key) => {
        if (Boolean(headers[key])) {
            acc[key] = headers[key];
        }
        return acc;
    }, {});
}

export function printResponse(
    status: number,
    headers: Record<string, string>,
    body: Buffer
): string {
    const headersStr = JSON.stringify(headers);
    const bodyStr = body.toString('utf8');
    return `status=${status} headers=${headersStr} body=${bodyStr}`;
}

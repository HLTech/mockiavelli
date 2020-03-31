import { HttpMethod, RequestMatcher } from './types';
import { BrowserRequest } from './controllers/BrowserController';

export function tryJsonParse(data: any): any | undefined {
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

export function printRequest(request: BrowserRequest): string {
    return `type=${request.type} method=${request.method} url=${request.url}`;
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

export function getCorsHeaders(
    request: BrowserRequest
): Record<string, string> {
    const requestHeaders = request.headers;
    const origin = request.sourceOrigin;
    const headers = {
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
 * Sanitize headers object from empty or null values
 * because they make request hang indefinitely in puppeteer
 */
export function sanitizeHeaders(
    headers: Record<string, string>
): Record<string, string> {
    return Object.keys(headers).reduce<Record<string, string>>((acc, key) => {
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

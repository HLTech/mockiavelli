import { parse } from 'url';
import { Request } from 'puppeteer';
import { ReceivedRequest } from './types';

export function requestToPlainObject(request: Request): ReceivedRequest {
    const url = request.url();
    const rawBody = request.postData();
    // TODO find a better alternative for url.parse
    const { pathname, query, protocol, host } = parse(url, true);
    return {
        url,
        rawBody,
        body: toJson(rawBody),
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
    } catch (e) {}
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
    return `${request.resourceType()} ${request.method()} ${request.url()}`;
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

export function arePathsDifferent(path?: string, paramsRegexp?: RegExp) {
    if (paramsRegexp && path) {
        return !paramsRegexp.test(path);
    }

    return false;
}

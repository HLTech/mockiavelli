import { parse } from 'url';
import { Request } from 'puppeteer';
import { MatchedRequest } from './types';

export function requestToPlainObject(request: Request): MatchedRequest {
    const url = request.url();
    const rawBody = request.postData();
    const { pathname, query } = parse(url, true);
    return {
        url,
        rawBody,
        body: toJson(rawBody),
        method: request.method(),
        headers: request.headers(),
        type: request.resourceType(),
        path: pathname,
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

export function waitFor(fn: () => boolean, timeout = 100): Promise<void> {
    const timeStart = Date.now();
    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            if (Date.now() - timeStart > timeout) {
                clearInterval(intervalId);
                return reject(
                    new Error(
                        `waitFor timeout - provided function did not return true in ${timeout}ms`
                    )
                );
            } else if (fn()) {
                resolve();
                clearInterval(intervalId);
            }
        });
    });
}

export function printRequest(request: Request): string {
    return `${request.resourceType()} ${request.method()} ${request.url()}`;
}

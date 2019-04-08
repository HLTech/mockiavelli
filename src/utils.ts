import { parse } from 'url';
import { Request } from 'puppeteer';
import { InterceptedRequest } from './types';

export function requestToPlainObject(request: Request): InterceptedRequest {
    const url = request.url();
    const rawBody = request.postData();
    const urlObject = parse(url, true);
    return {
        url,
        rawBody,
        body: toJson(rawBody),
        method: request.method(),
        headers: request.headers(),
        type: request.resourceType(),
        ...urlObject,
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

export function waitFor(fn: () => boolean): Promise<void> {
    return new Promise(resolve => {
        const intervalId = setInterval(() => {
            if (fn()) {
                resolve();
                clearInterval(intervalId);
            }
        });
    });
}

export function printRequest(request: Request): string {
    return `${request.resourceType()} ${request.method()} ${request.url()}`;
}

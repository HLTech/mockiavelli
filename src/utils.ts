import { Request } from 'puppeteer';
import { InterceptedRequest } from './types';

export function requestToPlainObject(
    request: Request,
    requestOrigin: string
): InterceptedRequest {
    const origin = requestOrigin.endsWith('/')
        ? requestOrigin.slice(0, -1)
        : requestOrigin;
    const url = request.url();
    const path = url.replace(origin, '');
    const rawBody = request.postData();

    return {
        url,
        path,
        rawBody,
        body: toJson(rawBody),
        method: request.method(),
        headers: request.headers(),
        type: request.resourceType(),
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

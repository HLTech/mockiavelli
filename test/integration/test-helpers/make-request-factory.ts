import { Page } from 'puppeteer';

export function makeRequestFactory(page: Page) {
    return async function(
        method: string,
        url: string,
        headers?: Record<string, string>,
        body?: any
    ): Promise<{ status: number; headers: Record<string, string>; body: any }> {
        return page.evaluate(makeRequest, url, method, headers, body);
    };
}

function makeRequest(
    url: string,
    method: string,
    headers: Record<string, string>,
    body
) {
    function headersToObject(headers: Headers): Record<string, string> {
        const headerObj = {};
        const keyVals = [...headers.entries()];
        keyVals.forEach(([key, val]) => {
            headerObj[key] = val;
        });
        return headerObj;
    }

    function getParsedBody(body: string): string {
        try {
            return JSON.parse(body);
        } catch (e) {
            return body;
        }
    }

    return fetch(url, { method, headers, body })
        .then(res => {
            return Promise.all([res.status, res.headers, res.text()]);
        })
        .then(([status, headers, body]) => {
            return {
                status,
                body: getParsedBody(body),
                headers: headersToObject(headers),
            };
        });
}

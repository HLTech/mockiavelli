interface MakeRequestParams {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
    options?: { waitForRequestEnd: boolean };
}

export function makeRequest(params: MakeRequestParams) {
    const {
        url,
        method,
        headers,
        body,
        options = { waitForRequestEnd: true },
    } = params;
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

    function makeRequest() {
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

    const request = makeRequest();

    if (options.waitForRequestEnd === true) {
        return request;
    } else {
        return null;
    }
}

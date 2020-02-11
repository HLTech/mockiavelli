import { Mocketeer, HttpMethod } from '../../src';
import { Browser, launch, Page } from 'puppeteer';
import { makeRequestFactory } from './test-helpers/make-request-factory';

const PORT = 9000;

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

type MocketeerHttpMethods =
    | 'mockGET'
    | 'mockPUT'
    | 'mockPOST'
    | 'mockDELETE'
    | 'mockPATCH';

describe('Mocketeer integration', () => {
    let browser: Browser;
    let page: Page;
    let mocketeer: Mocketeer;
    let makeRequest: ReturnType<typeof makeRequestFactory>;

    beforeAll(async () => {
        browser = await launch({
            headless: true,
            devtools: false,
            args: ['--no-sandbox'],
        });
    });

    afterAll(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        // Setup new page (tab)
        page = await browser.newPage();
        await page.goto(`http://localhost:${PORT}`);

        // Instantiate Mocketeer
        mocketeer = await Mocketeer.setup(page);

        makeRequest = makeRequestFactory(page);
    });

    afterEach(async () => {
        await page.close();
    });

    test.each(METHODS)('matches request with .mock method ', async METHOD => {
        mocketeer.mock(
            {
                method: METHOD,
                url: '/foo',
            },
            { status: 200, body: METHOD }
        );
        const result = await makeRequest(METHOD, '/foo');
        expect(result.body).toEqual(METHOD);
    });

    test.each(METHODS)(
        'matches request with .mock%s() method and URL string',
        async METHOD => {
            mocketeer[('mock' + METHOD) as MocketeerHttpMethods]('/example', {
                status: 200,
                body: METHOD,
            });
            const response = await makeRequest(METHOD, '/example');
            expect(response.body).toEqual(METHOD);
        }
    );

    test.each(METHODS)(
        'matches request with .mock%s() method matcher object',
        async METHOD => {
            mocketeer[('mock' + METHOD) as MocketeerHttpMethods](
                { url: '/example' },
                {
                    status: 200,
                    body: METHOD,
                }
            );
            const response = await makeRequest(METHOD, '/example');
            expect(response.body).toEqual(METHOD);
        }
    );

    test('matches request when filter does not define query params but request has', async () => {
        mocketeer.mockGET('/example', { status: 200 });
        const result = await makeRequest('GET', '/example?param=value');
        expect(result.status).toEqual(200);
    });

    test('does not match request when methods does not match', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mocketeer.mock(
            { method: 'GET', url: '/example' },
            { status: 200, body: 'ok' }
        );
        const response = await makeRequest('POST', '/example?param=value');
        expect(response.body).not.toEqual('ok');
    });

    test('does not match request when URLs does not match', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mocketeer.mock(
            { method: 'GET', url: '/example' },
            { status: 200, body: 'ok' }
        );
        const response1 = await makeRequest('GET', '/exampleFoo');
        const response2 = await makeRequest('GET', '/exampl');
        expect(response1.body).not.toEqual('ok');
        expect(response2.body).not.toEqual('ok');
    });

    test('match by request body', async () => {
        mocketeer.mockPOST(
            { url: '/example', body: { key: 'value' } },
            { status: 200 }
        );
        const response = await makeRequest(
            'POST',
            '/example',
            {},
            JSON.stringify({ key: 'value' })
        );
        expect(response.status).toEqual(200);
    });

    test('match by request body - negative scenario', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mocketeer.mockPOST(
            { url: '/example', body: { key: 'value' } },
            { status: 200 }
        );
        const response = await makeRequest(
            'POST',
            '/example',
            {},
            JSON.stringify({ key: 'non_matching_value' })
        );
        expect(response.status).toEqual(404);
    });

    it('mocks multiple requests', async () => {
        mocketeer.mockGET('/foo', { status: 200 });
        const res1 = await makeRequest('GET', '/foo');
        const res2 = await makeRequest('GET', '/foo');
        expect(res1.status).toEqual(200);
        expect(res2.status).toEqual(200);
    });

    it('can defined mocked response with status 500', async () => {
        mocketeer.mockGET('/foo', { status: 500 });
        const res = await makeRequest('GET', '/foo');
        expect(res.status).toEqual(500);
    });

    test('matches request with query passed in URL', async () => {
        mocketeer.mockGET('/example?param=value', { status: 200 });
        const response = await makeRequest('GET', '/example?param=value');
        expect(response.status).toEqual(200);
    });

    test('matches request with query defined as object', async () => {
        mocketeer.mockGET(
            {
                url: '/example',
                query: {
                    param: 'value',
                },
            },
            { status: 200 }
        );
        const response = await makeRequest('GET', '/example?param=value');
        expect(response.status).toEqual(200);
    });

    test('matches request by query - ignores params order', async () => {
        mocketeer.mockGET('/example?param=value&param2=value2', {
            status: 200,
        });
        const response = await makeRequest(
            'GET',
            '/example?param2=value2&param=value'
        );
        expect(response.status).toEqual(200);
    });

    test('matches request by query - ignores excessive params', async () => {
        mocketeer.mockGET('/example?param=value', { status: 200 });
        const response = await makeRequest(
            'GET',
            '/example?param=value&foo=bar'
        );
        expect(response.status).toEqual(200);
    });

    test('does not match requests with non-matching query params', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        mocketeer.mockGET('/example?param=value', { status: 200 });
        const response = await makeRequest('GET', '/example?param=nonMatching');
        expect(response.status).toEqual(404);
    });

    it('.waitForRequest() returns intercepted request data', async () => {
        const mock = await mocketeer.mockPOST('/foo', { status: 200 });

        const headers = {
            'x-header': 'FOO',
        };
        const body = { payload: 'ok' };
        await makeRequest('POST', '/foo', headers, JSON.stringify(body));

        await expect(mock.waitForRequest()).resolves.toMatchObject({
            method: 'POST',
            path: '/foo',
            body: body,
            url: `http://localhost:${PORT}/foo`,
            headers: headers,
        });
    });

    it('.waitForRequest() rejects when request matching mock was not found', async () => {
        const mock = await mocketeer.mock(
            { method: 'GET', url: '/some_endpoint' },
            { status: 200, body: 'OK' }
        );

        await expect(mock.waitForRequest(0)).rejects.toMatchObject({
            message: expect.stringMatching(
                /No request matching mock \[\(\d+\) GET \/some_endpoint\] found/
            ),
        });

        await makeRequest('GET', '/some_endpoint');

        await expect(mock.waitForRequest(0)).resolves.toEqual(
            expect.anything()
        );
        await expect(mock.waitForRequest(1)).rejects.toMatchObject({
            message: expect.stringMatching(
                /2nd request matching mock \[\(\d+\) GET \/some_endpoint\] was not found/
            ),
        });
    });

    it('notifies when mock was called', async () => {
        const mock = await mocketeer.mockGET('/foo', { status: 200 });

        await page.evaluate(() => {
            setTimeout(() => {
                fetch('/foo');
            }, 10);
        });

        await expect(mock.waitForRequest()).resolves.toBeTruthy();
    });

    it('can set priorities on mocks', async () => {
        const mock = await mocketeer.mockGET('/foo', { status: 200 });

        const mockWithPriority = await mocketeer.mockGET(
            '/foo',
            { status: 200 },
            {
                priority: 10,
            }
        );

        await makeRequest('GET', '/foo');

        await expect(mock.waitForRequest()).rejects.toEqual(expect.anything());
        await expect(mockWithPriority.waitForRequest()).resolves.toEqual(
            expect.anything()
        );
    });

    it('can remove mock so it is no longer called', async () => {
        const mock = await mocketeer.mockGET('/foo', {
            status: 200,
            body: { id: 1 },
        });

        await makeRequest('GET', '/foo');

        mocketeer.removeMock(mock);

        await mocketeer.mockGET('/foo', {
            status: 200,
            body: { id: 2 },
        });

        const result = await makeRequest('GET', '/foo');

        expect(result.body).toEqual({ id: 2 });
    });

    it('can inspect requests that are invoke asynchronously', async () => {
        const mock = await mocketeer.mockGET('/foo', { status: 200 });

        await page.evaluate(() => {
            document.body.innerHTML = 'content';
            document.body.addEventListener('click', () => {
                setTimeout(() => fetch('/foo'), 10);
            });
        });

        await page.click('body');

        await expect(mock.waitForRequest()).resolves.toEqual(expect.anything());
    });

    describe('ordering', () => {
        it('matches only once request with once set to true', async () => {
            spyOn(console, 'error');
            await mocketeer.mockGET(
                '/foo',
                { status: 200 },
                {
                    once: true,
                }
            );

            expect((await makeRequest('GET', '/foo')).status).toBe(200);
            expect((await makeRequest('GET', '/foo')).status).toBe(404);
            expect(console.error).toHaveBeenCalled();
        });

        it('fallbacks to previously defined mock when once=true', async () => {
            await mocketeer.mockGET('/foo', { status: 200 });
            await mocketeer.mockGET(
                '/foo',
                { status: 201 },
                {
                    once: true,
                }
            );

            expect((await makeRequest('GET', '/foo')).status).toBe(201);
            expect((await makeRequest('GET', '/foo')).status).toBe(200);
            expect((await makeRequest('GET', '/foo')).status).toBe(200);
        });

        it('matches only once every request in order with once set to true', async () => {
            await mocketeer.mockGET(
                '/foo',
                { status: 200, body: {} },
                { once: true }
            );

            await mocketeer.mockGET(
                '/foo',
                { status: 201, body: {} },
                {
                    once: true,
                }
            );

            expect((await makeRequest('GET', '/foo')).status).toBe(201);
            expect((await makeRequest('GET', '/foo')).status).toBe(200);
        });

        it('matches newest request when added mock with same filter', async () => {
            await mocketeer.mockGET('/foo', { status: 200, body: {} });
            expect((await makeRequest('GET', '/foo')).status).toBe(200);

            await mocketeer.mockGET('/foo', { status: 201, body: {} });
            expect((await makeRequest('GET', '/foo')).status).toBe(201);
        });

        it('matches newest request when multiple mocks have same filter', async () => {
            await mocketeer.mockGET('/foo', { status: 200, body: {} });
            await mocketeer.mockGET('/foo', { status: 201, body: {} });

            expect((await makeRequest('GET', '/foo')).status).toBe(201);
        });

        it('matches newest request when added mock with same filter and older mock has once set to true ', async () => {
            await mocketeer.mockGET(
                '/foo',
                { status: 200, body: {} },
                { once: true }
            );
            expect((await makeRequest('GET', '/foo')).status).toBe(200);

            await mocketeer.mockGET('/foo', { status: 201, body: {} });
            expect((await makeRequest('GET', '/foo')).status).toBe(201);
        });

        it('matches requests with once set to true in correct order when multiple mocks have same filter', async () => {
            await mocketeer.mockGET(
                '/foo',
                { status: 200, body: {} },
                { once: true }
            );

            await mocketeer.mockGET(
                '/foo',
                { status: 201, body: {} },
                {
                    once: true,
                }
            );

            await mocketeer.mockGET(
                '/foo',
                { status: 202, body: {} },
                {
                    once: true,
                }
            );

            expect((await makeRequest('GET', '/foo')).status).toBe(202);
            expect((await makeRequest('GET', '/foo')).status).toBe(201);
            expect((await makeRequest('GET', '/foo')).status).toBe(200);
        });

        it('matches request with highest priority when multiple mocks have same filter', async () => {
            await mocketeer.mockGET(
                '/foo',
                { status: 200, body: {} },
                { priority: 10 }
            );

            await mocketeer.mockGET('/foo', { status: 201, body: {} });

            await mocketeer.mockGET(
                '/foo',
                { status: 202, body: {} },
                { priority: 5 }
            );

            expect((await makeRequest('GET', '/foo')).status).toBe(200);
        });

        it('matches request in correct order with priority and once set to true when multiple mocks have same filter', async () => {
            await mocketeer.mockGET('/foo', { status: 200, body: {} });

            await mocketeer.mockGET(
                '/foo',
                { status: 201, body: {} },
                { once: true, priority: 10 }
            );

            await mocketeer.mockGET(
                '/foo',
                { status: 202, body: {} },
                { once: true }
            );

            await mocketeer.mockGET(
                '/foo',
                { status: 203, body: {} },
                { once: true, priority: 10 }
            );

            await mocketeer.mockGET(
                '/foo',
                { status: 204, body: {} },
                { once: true, priority: 5 }
            );

            expect((await makeRequest('GET', '/foo')).status).toBe(203);
            expect((await makeRequest('GET', '/foo')).status).toBe(201);
            expect((await makeRequest('GET', '/foo')).status).toBe(204);
            expect((await makeRequest('GET', '/foo')).status).toBe(202);
            expect((await makeRequest('GET', '/foo')).status).toBe(200);
            expect((await makeRequest('GET', '/foo')).status).toBe(200);
        });
    });

    describe('path variables', () => {
        it('mocks fetch GET request with path variable as number', async () => {
            const mock = await mocketeer.mockGET('/foo/:id', { status: 200 });

            await makeRequest('GET', '/foo/123');
            const request = await mock.waitForRequest();

            await expect(request.params.id).toBe('123');
        });

        it('mocks fetch GET request with path variable as string', async () => {
            const mock = await mocketeer.mockGET('/foo/:id', { status: 200 });

            await makeRequest('GET', '/foo/test');
            const request = await mock.waitForRequest();

            await expect(request.params.id).toBe('test');
        });

        it('mocks fetch GET request with path variable and query', async () => {
            const mock = await mocketeer.mock(
                { url: '/foo/:id?param=fooParam', method: 'GET' },
                { status: 200 }
            );
            await makeRequest('GET', '/foo/123?param=fooParam');
            const request = await mock.waitForRequest();

            await expect(request.params.id).toBe('123');
        });

        it('mocks fetch GET request with schema, origin, path variable and query', async () => {
            const mock = await mocketeer.mock(
                {
                    url: 'https://localhost:3000/foo/:id?param=fooParam',
                    method: 'GET',
                },
                { status: 200 }
            );
            await makeRequest(
                'GET',
                'https://localhost:3000/foo/123?param=fooParam'
            );
            const request = await mock.waitForRequest();

            await expect(request.params.id).toBe('123');
        });

        it('mocks fetch GET request with multiple path variables', async () => {
            const mock = await mocketeer.mock(
                { url: '/foo/:id/:name', method: 'GET' },
                { status: 200 }
            );
            await makeRequest('GET', '/foo/123/mike');
            const request = await mock.waitForRequest();

            await expect(request.params.id).toBe('123');
            await expect(request.params.name).toBe('mike');
        });
    });

    test('does not mock request to assets (scripts, styles) by default', async () => {
        await page.goto(`http://localhost:${PORT}/page1.html`);
        await expect(page.title()).resolves.toEqual('page1');
        await expect(
            page.evaluate(() => window['scriptLoaded'])
        ).resolves.toEqual(true);
        await expect(
            page.evaluate(() =>
                window.getComputedStyle(document.body).getPropertyValue('color')
            )
        ).resolves.toEqual('rgb(255, 0, 0)');
    });

    test('respond with 404 for unmocked fetch requests', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const response = await makeRequest('GET', '/unmocked');
        expect(response.status).toEqual(404);
    });

    test('respond with 404 for unmocked XHR requests', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        await expect(
            page.evaluate(
                () =>
                    new Promise(resolve => {
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', '/unmocked', true);
                        xhr.onloadend = () => resolve(xhr.status);
                        xhr.send(null);
                    })
            )
        ).resolves.toEqual(404);
    });

    test('mock redirect requests', async () => {
        await mocketeer.mockGET('/redirect', {
            status: 302,
            headers: {
                Location: `http://localhost:${PORT}/page1.html`,
            },
        });

        await page.evaluate(() => {
            // @ts-ignore
            window.location = '/redirect';
        });

        await page.waitForNavigation();
        await expect(page.title()).resolves.toEqual('page1');
    });

    test('mock request with string in response (instead of JSON)', async () => {
        await mocketeer.mockGET('/resource', {
            status: 200,
            body: 'testBody',
        });
        const result = await makeRequest('GET', '/resource');
        expect(result.body).toEqual('testBody');
    });

    test('allow to provide content-type manually', async () => {
        await mocketeer.mockGET('/resource', {
            status: 200,
            headers: {
                'content-type': 'text/html',
            },
            body: '<div>test</div>',
        });
        const result = await makeRequest('GET', '/resource');
        expect(result.headers['content-type']).toEqual('text/html');
        expect(result.body).toEqual('<div>test</div>');
    });

    test('mock request to assets', async () => {
        mocketeer.mockGET('/script.js', {
            headers: {
                'Content-Type': 'text/javascript; charset=UTF-8',
            },
            status: 200,
            body: `window.mockLoaded = true`,
        });
        await page.goto(`http://localhost:${PORT}/page1.html`);
        await expect(
            page.evaluate(() => window['mockLoaded'])
        ).resolves.toEqual(true);
    });

    test('mocked response as a function', async () => {
        await mocketeer.mockGET('/resource', () => {
            const body = 'hello' + 'world';
            return {
                status: 200,
                body,
            };
        });
        const respose = await makeRequest('GET', '/resource');
        expect(respose.body).toEqual('helloworld');
    });

    test('mocked response in function of request data', async () => {
        await mocketeer.mockPOST('/resource/:id', request => {
            return {
                status: 200,
                body: {
                    query: request.query,
                    url: request.url,
                    body: request.body,
                    method: request.method,
                    params: request.params,
                },
            };
        });

        const response = await makeRequest(
            'POST',
            '/resource/123?param=testParam',
            {},
            'testBody'
        );
        expect(response.body).toEqual({
            query: {
                param: 'testParam',
            },
            url: 'http://localhost:9000/resource/123?param=testParam',
            method: 'POST',
            body: 'testBody',
            params: { id: '123' },
        });
    });

    test('mock cross-origin requests', async () => {
        await mocketeer.mockPOST('http://example.com/resource', {
            status: 200,
            body: '',
        });
        const response = await makeRequest(
            'POST',
            'http://example.com/resource'
        );
        expect(response.status).toEqual(200);
    });

    test('mock cross-origin redirect requests', async () => {
        await mocketeer.mockGET('http://example.com/redirect', {
            status: 302,
            headers: {
                Location: `http://localhost:${PORT}/page1.html`,
            },
        });

        await page.evaluate(() => {
            window.location.assign('http://example.com/redirect');
        });

        await page.waitForNavigation();
        await expect(page.title()).resolves.toEqual('page1');
    });

    test('set correct response headers when response body is empty', async () => {
        await mocketeer.mockGET('/example', { status: 200 });
        const response = await makeRequest('GET', '/example');
        expect(response.headers['content-length']).toBe('0');
        expect(response.headers['content-type']).toBe(undefined);
    });

    test('set correct response headers when response body is not empty', async () => {
        await mocketeer.mockGET('/example', {
            status: 200,
            body: { ok: 'yes' },
        });
        const response = await makeRequest('GET', '/example');
        expect(response.headers['content-length']).toBe('12');
        expect(response.headers['content-type']).toContain(
            'application/json; charset=utf-8'
        );
    });

    test('wait for a number of requests to be matched', async () => {
        const mock = await mocketeer.mockGET('/example', { status: 200 });
        await makeRequest('GET', '/example');
        await makeRequest('GET', '/example');
        await mock.waitForRequestsCount(2);
    });

    test('wait for a number of requests to be matched - async scenario', async () => {
        const mock = await mocketeer.mockGET('/example', { status: 200 });
        await makeRequest('GET', '/example', {}, undefined, {
            waitForRequestEnd: false,
        });
        await makeRequest('GET', '/example', {}, undefined, {
            waitForRequestEnd: false,
        });
        await mock.waitForRequestsCount(2);
    });
});

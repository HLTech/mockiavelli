import { Mocketeer } from '../../src';
import { Browser, launch, Page } from 'puppeteer';
import {
    requestDeleteFoo,
    requestFoo,
    requestFooWithQuery,
    requestGetFoo,
    requestGetFooWithQuery,
    requestPostFoo,
    requestPutFoo,
    response200Empty,
    response200Ok,
} from './fixture/mock-fixtures';
import { makeRequestFactory } from './test-helpers/make-request-factory';

const PORT = 9000;

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

    describe('mockREST', () => {
        it('mocks fetch GET request', async () => {
            await mocketeer.mock(requestGetFoo, response200Ok);
            const result = await makeRequest('GET', '/foo');
            expect(result.status).toEqual(200);
        });

        it('mocks fetch GET request with query', async () => {
            await mocketeer.mock(requestGetFooWithQuery, response200Ok);
            const result = await makeRequest('GET', '/foo?param=fooParam');
            expect(result.status).toEqual(200);
        });

        it('mocks fetch POST request ', async () => {
            await mocketeer.mock(requestPostFoo, response200Ok);
            const result = await makeRequest('POST', '/foo');
            expect(result.status).toEqual(200);
        });

        it('mocks fetch PUT request ', async () => {
            await mocketeer.mock(requestPutFoo, response200Ok);

            const result = await makeRequest('PUT', '/foo');
            expect(result.status).toEqual(200);
        });

        it('mocks fetch DELETE request ', async () => {
            await mocketeer.mock(requestDeleteFoo, response200Ok);
            const result = await makeRequest('DELETE', '/foo');
            expect(result.status).toEqual(200);
        });
    });

    describe('mock http methods', () => {
        it('mocks fetch GET request', async () => {
            const mock = await mocketeer.mockGET(requestFoo, response200Empty);

            await makeRequest('GET', '/foo');

            await expect(mock.getRequest()).resolves.toMatchObject({
                method: 'GET',
            });
        });

        it('mocks fetch GET request using filter as string with query', async () => {
            await mocketeer.mockGET('/foo?param=fooParam', response200Ok);
            const result = await makeRequest('GET', '/foo?param=fooParam');
            expect(result.status).toEqual(200);
        });

        it('mocks fetch GET request using filter object and query object', async () => {
            await mocketeer.mockGET(requestFooWithQuery, response200Ok);
            const result = await makeRequest('GET', '/foo?param=fooParam');
            expect(result.status).toEqual(200);
        });

        it('mocks fetch POST request', async () => {
            const mock = await mocketeer.mockPOST(requestFoo, response200Empty);
            await makeRequest('POST', '/foo');
            await expect(mock.getRequest()).resolves.toMatchObject({
                method: 'POST',
            });
        });

        it('mocks fetch POST request using filter as string with query', async () => {
            await mocketeer.mockPOST('/foo?param=fooParam', response200Ok);
            const result = await makeRequest('POST', '/foo?param=fooParam');
            expect(result.status).toEqual(200);
        });

        it('mocks fetch POST request using filter object and query object', async () => {
            await mocketeer.mockPOST(requestFooWithQuery, response200Ok);
            const result = await makeRequest('POST', '/foo?param=fooParam');
            expect(result.status).toEqual(200);
        });

        it('mocks fetch PUT request', async () => {
            const mock = await mocketeer.mockPUT(requestFoo, response200Empty);
            await makeRequest('PUT', '/foo');
            await expect(mock.getRequest()).resolves.toMatchObject({
                method: 'PUT',
            });
        });

        it('mocks fetch PUT request using filter as string with query', async () => {
            await mocketeer.mockPUT('/foo?param=fooParam', response200Ok);
            const result = await makeRequest('PUT', '/foo?param=fooParam');
            expect(result.status).toEqual(200);
        });

        it('mocks fetch PUT request using filter object and query object', async () => {
            await mocketeer.mockPUT(requestFooWithQuery, response200Ok);
            const result = await makeRequest('PUT', '/foo?param=fooParam');
            expect(result.status).toEqual(200);
        });

        it('mocks fetch DELETE request', async () => {
            const mock = await mocketeer.mockDELETE(
                requestFoo,
                response200Empty
            );
            await makeRequest('DELETE', '/foo');
            await expect(mock.getRequest()).resolves.toMatchObject({
                method: 'DELETE',
            });
        });

        it('mocks fetch DELETE request using filter as string with query', async () => {
            await mocketeer.mockDELETE('/foo?param=fooParam', response200Ok);
            const result = await makeRequest('DELETE', '/foo?param=fooParam');
            expect(result.status).toEqual(200);
        });

        it('mocks fetch DELETE request using filter object and query object', async () => {
            await mocketeer.mockDELETE(requestFooWithQuery, response200Ok);
            const result = await makeRequest('DELETE', '/foo?param=fooParam');
            expect(result.status).toEqual(200);
        });
    });

    it('mocks multiple requests', async () => {
        await mocketeer.mock(requestGetFoo, response200Empty);
        const res1 = await makeRequest('GET', '/foo');
        const res2 = await makeRequest('GET', '/foo');
        expect(res1.status).toEqual(200);
        expect(res2.status).toEqual(200);
    });

    it('mocks response with status 500', async () => {
        await mocketeer.mock(requestGetFoo, {
            status: 500,
            body: {},
        });
        const res = await makeRequest('GET', '/foo');
        expect(res.status).toEqual(500);
    });

    it('records intercepted request', async () => {
        const mock = await mocketeer.mock(requestPostFoo, response200Empty);
        const headers = {
            'x-header': 'FOO',
        };
        const body = JSON.stringify({ payload: 'ok' });
        await makeRequest('POST', '/foo', headers, body);

        await expect(mock.getRequest()).resolves.toMatchObject({
            method: 'POST',
            path: '/foo',
            body: JSON.parse(body),
            rawBody: body,
            url: `http://localhost:${PORT}/foo`,
            headers: headers,
        });
    });

    it('.getRequest() rejects when request matching mock was not found', async () => {
        const mock = await mocketeer.mock(
            { method: 'GET', url: '/some_endpoint' },
            { status: 200, body: 'OK' }
        );

        await expect(mock.getRequest(0)).rejects.toMatchObject({
            message: expect.stringMatching(
                /No request matching mock \[\(\d+\) GET \/some_endpoint\] found/
            ),
        });

        await makeRequest('GET', '/some_endpoint');

        await expect(mock.getRequest(0)).resolves.toEqual(expect.anything());
        await expect(mock.getRequest(1)).rejects.toMatchObject({
            message: expect.stringMatching(
                /2nd request matching mock \[\(\d+\) GET \/some_endpoint\] was not found/
            ),
        });
    });

    it('notifies when mock was called', async () => {
        const mock = await mocketeer.mock(requestGetFoo, response200Empty);

        await page.evaluate(() => {
            setTimeout(() => {
                fetch('/foo');
            }, 10);
        });

        await expect(mock.getRequest()).resolves.toBeTruthy();
    });

    it('can set priorities on mocks', async () => {
        const mock = await mocketeer.mock(requestGetFoo, response200Empty);

        const mockWithPriority = await mocketeer.mock(
            requestGetFoo,
            response200Empty,
            {
                priority: 10,
            }
        );

        await makeRequest('GET', '/foo');

        await expect(mock.getRequest()).rejects.toEqual(expect.anything());
        await expect(mockWithPriority.getRequest()).resolves.toEqual(
            expect.anything()
        );
    });

    it('can remove mock so it is no longer called', async () => {
        const mock = await mocketeer.mock(requestGetFoo, {
            status: 200,
            body: { id: 1 },
        });

        await makeRequest('GET', '/foo');

        mocketeer.removeMock(mock);

        await mocketeer.mock(requestGetFoo, {
            status: 200,
            body: { id: 2 },
        });

        const result = await makeRequest('GET', '/foo');

        expect(result.body).toEqual({ id: 2 });
    });

    it('can inspect requests that are invoke asynchronously', async () => {
        const mock = await mocketeer.mock(requestGetFoo, response200Empty);

        await page.evaluate(() => {
            document.body.innerHTML = 'content';
            document.body.addEventListener('click', () => {
                setTimeout(() => fetch('/foo'), 10);
            });
        });

        await page.click('body');

        await expect(mock.getRequest()).resolves.toEqual(expect.anything());
    });

    describe('ordering', () => {
        it('matches only once request with once set to true', async () => {
            spyOn(console, 'error');
            await mocketeer.mock(requestGetFoo, response200Ok, {
                once: true,
            });

            expect((await makeRequest('GET', '/foo')).status).toBe(200);
            expect((await makeRequest('GET', '/foo')).status).toBe(404);
            expect(console.error).toHaveBeenCalled();
        });

        it('matches only once request with once set to true', async () => {
            await mocketeer.mock(requestGetFoo, { status: 200, body: {} });

            await mocketeer.mock(
                requestGetFoo,
                { status: 201, body: {} },
                {
                    once: true,
                }
            );

            expect((await makeRequest('GET', '/foo')).status).toBe(201);
            expect((await makeRequest('GET', '/foo')).status).toBe(200);
            expect((await makeRequest('GET', '/foo')).status).toBe(200);
        });

        it('matches only once every request in order with once set to true', async () => {
            await mocketeer.mock(
                requestGetFoo,
                { status: 200, body: {} },
                { once: true }
            );

            await mocketeer.mock(
                requestGetFoo,
                { status: 201, body: {} },
                {
                    once: true,
                }
            );

            expect((await makeRequest('GET', '/foo')).status).toBe(201);
            expect((await makeRequest('GET', '/foo')).status).toBe(200);
        });

        it('matches newest request when added mock with same filter', async () => {
            await mocketeer.mock(requestGetFoo, { status: 200, body: {} });
            expect((await makeRequest('GET', '/foo')).status).toBe(200);

            await mocketeer.mock(requestGetFoo, { status: 201, body: {} });
            expect((await makeRequest('GET', '/foo')).status).toBe(201);
        });

        it('matches newest request when multiple mocks have same filter', async () => {
            await mocketeer.mock(requestGetFoo, { status: 200, body: {} });
            await mocketeer.mock(requestGetFoo, { status: 201, body: {} });

            expect((await makeRequest('GET', '/foo')).status).toBe(201);
        });

        it('matches newest request when added mock with same filter and older mock has once set to true ', async () => {
            await mocketeer.mock(
                requestGetFoo,
                { status: 200, body: {} },
                { once: true }
            );
            expect((await makeRequest('GET', '/foo')).status).toBe(200);

            await mocketeer.mock(requestGetFoo, { status: 201, body: {} });
            expect((await makeRequest('GET', '/foo')).status).toBe(201);
        });

        it('matches requests with once set to true in correct order when multiple mocks have same filter', async () => {
            await mocketeer.mock(
                requestGetFoo,
                { status: 200, body: {} },
                { once: true }
            );

            await mocketeer.mock(
                requestGetFoo,
                { status: 201, body: {} },
                {
                    once: true,
                }
            );

            await mocketeer.mock(
                requestGetFoo,
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
            await mocketeer.mock(
                requestGetFoo,
                { status: 200, body: {} },
                { priority: 10 }
            );

            await mocketeer.mock(requestGetFoo, { status: 201, body: {} });

            await mocketeer.mock(
                requestGetFoo,
                { status: 202, body: {} },
                { priority: 5 }
            );

            expect((await makeRequest('GET', '/foo')).status).toBe(200);
        });

        it('matches request in correct order with priority and once set to true when multiple mocks have same filter', async () => {
            await mocketeer.mock(
                requestGetFoo,
                { status: 200, body: {} },
                { once: true }
            );

            await mocketeer.mock(
                requestGetFoo,
                { status: 201, body: {} },
                { once: true, priority: 10 }
            );

            await mocketeer.mock(
                requestGetFoo,
                { status: 202, body: {} },
                { once: true }
            );

            await mocketeer.mock(
                requestGetFoo,
                { status: 203, body: {} },
                { once: true, priority: 10 }
            );

            await mocketeer.mock(
                requestGetFoo,
                { status: 204, body: {} },
                { once: true, priority: 5 }
            );

            await mocketeer.mock(
                requestGetFoo,
                { status: 205, body: {} },
                { once: true }
            );

            expect((await makeRequest('GET', '/foo')).status).toBe(203);
            expect((await makeRequest('GET', '/foo')).status).toBe(201);
            expect((await makeRequest('GET', '/foo')).status).toBe(204);
            expect((await makeRequest('GET', '/foo')).status).toBe(205);
            expect((await makeRequest('GET', '/foo')).status).toBe(202);
            expect((await makeRequest('GET', '/foo')).status).toBe(200);
        });
    });

    describe('path variables', () => {
        it('mocks fetch GET request with path variable as number', async () => {
            const mock = await mocketeer.mockGET('/foo/:id', response200Empty);

            await makeRequest('GET', '/foo/123');
            const request = await mock.getRequest();

            await expect(request.params.id).toBe('123');
        });

        it('mocks fetch GET request with path variable as string', async () => {
            const mock = await mocketeer.mockGET('/foo/:id', response200Empty);

            await makeRequest('GET', '/foo/test');
            const request = await mock.getRequest();

            await expect(request.params.id).toBe('test');
        });

        it('mocks fetch GET request with path variable and query', async () => {
            const mock = await mocketeer.mock(
                { url: '/foo/:id?param=fooParam', method: 'GET' },
                response200Empty
            );
            await makeRequest('GET', '/foo/123?param=fooParam');
            const request = await mock.getRequest();

            await expect(request.params.id).toBe('123');
        });

        it('mocks fetch GET request with schema, origin, path variable and query', async () => {
            const mock = await mocketeer.mock(
                {
                    url: 'https://localhost:3000/foo/:id?param=fooParam',
                    method: 'GET',
                },
                response200Empty
            );
            await makeRequest(
                'GET',
                'https://localhost:3000/foo/123?param=fooParam'
            );
            const request = await mock.getRequest();

            await expect(request.params.id).toBe('123');
        });

        it('mocks fetch GET request with multiple path variables', async () => {
            const mock = await mocketeer.mock(
                { url: '/foo/:id/:name', method: 'GET' },
                response200Empty
            );
            await makeRequest('GET', '/foo/123/mike');
            const request = await mock.getRequest();

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
        await mocketeer.mock('/redirect', {
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

    test('mock cross-origin redirect requests', async () => {
        await mocketeer.mock('http://example.com/redirect', {
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

    test('mock request with string in response (instead of JSON)', async () => {
        await mocketeer.mock('/resource', {
            status: 200,
            body: 'testBody',
        });
        const result = await makeRequest('GET', '/resource');
        expect(result.body).toEqual('testBody');
    });

    test('allow to provide content-type manually', async () => {
        await mocketeer.mock('/resource', {
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
        mocketeer.mock('/script.js', {
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
        await mocketeer.mock('/resource', () => ({
            status: 199 + 1,
        }));
        const { status } = await makeRequest('GET', '/resource');
        expect(status).toEqual(200);
    });

    test('mocked response in function of request data', async () => {
        await mocketeer.mock('/resource', request => {
            return {
                status: 200,
                body: {
                    query: request.query,
                    url: request.url,
                    rawBody: request.rawBody,
                    method: request.method,
                },
            };
        });

        const response = await makeRequest(
            'POST',
            '/resource?param=testParam',
            {},
            'testBody'
        );
        expect(response.body).toEqual({
            query: {
                param: 'testParam',
            },
            url: 'http://localhost:9000/resource?param=testParam',
            method: 'POST',
            rawBody: 'testBody',
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
});

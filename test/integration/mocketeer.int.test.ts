import { Mocketeer } from '../../src';
import { Browser, launch, Page } from 'puppeteer';
import {
    response200Ok,
    requestGetFoo,
    requestPostFoo,
    response200Empty,
    requestGetFooWithQuery,
    requestFoo,
    requestFooWithQuery,
    requestPutFoo,
    requestDeleteFoo,
} from './fixture/mock-fixtures';

const PORT = 9000;

describe('Mocketeer integration', () => {
    let browser: Browser;
    let page: Page;
    let mocketeer: Mocketeer;

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
    });

    afterEach(async () => {
        await page.close();
    });

    describe('mockREST', () => {
        it('mocks fetch GET request', async () => {
            await mocketeer.mockREST(requestGetFoo, response200Ok);

            await page.evaluate(() => {
                fetch('/foo')
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });

        it('mocks fetch GET request with query', async () => {
            await mocketeer.mockREST(requestGetFooWithQuery, response200Ok);

            await page.evaluate(() => {
                fetch('/foo?param=fooParam')
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });

        it('mocks fetch POST request ', async () => {
            await mocketeer.mockREST(requestPostFoo, response200Ok);

            await page.evaluate(() => {
                fetch('/foo', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });

        it('mocks fetch PUT request ', async () => {
            await mocketeer.mockREST(requestPutFoo, response200Ok);

            await page.evaluate(() => {
                fetch('/foo', { method: 'PUT' })
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });

        it('mocks fetch DELETE request ', async () => {
            await mocketeer.mockREST(requestDeleteFoo, response200Ok);

            await page.evaluate(() => {
                fetch('/foo', { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });
    });

    describe('mock http methods', () => {
        it('mocks fetch GET request', async () => {
            const mock = await mocketeer.mockGET(requestFoo, response200Empty);

            await page.evaluate(() => {
                fetch('/foo', {
                    method: 'GET',
                });
            });

            await expect(mock.getRequest()).resolves.toMatchObject({
                method: 'GET',
            });
        });

        it('mocks fetch GET request using filter as string with query', async () => {
            await mocketeer.mockGET('/foo?param=fooParam', response200Ok);

            await page.evaluate(() => {
                fetch('/foo?param=fooParam')
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });

        it('mocks fetch GET request using filter object and query object', async () => {
            await mocketeer.mockGET(requestFooWithQuery, response200Ok);

            await page.evaluate(() => {
                fetch('/foo?param=fooParam')
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });

        it('mocks fetch POST request', async () => {
            const mock = await mocketeer.mockPOST(requestFoo, response200Empty);

            await page.evaluate(() => {
                fetch('/foo', {
                    method: 'POST',
                });
            });

            await expect(mock.getRequest()).resolves.toMatchObject({
                method: 'POST',
            });
        });

        it('mocks fetch POST request using filter as string with query', async () => {
            await mocketeer.mockPOST('/foo?param=fooParam', response200Ok);

            await page.evaluate(() => {
                fetch('/foo?param=fooParam', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });

        it('mocks fetch POST request using filter object and query object', async () => {
            await mocketeer.mockPOST(requestFooWithQuery, response200Ok);

            await page.evaluate(() => {
                fetch('/foo?param=fooParam', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });

        it('mocks fetch PUT request', async () => {
            const mock = await mocketeer.mockPUT(requestFoo, response200Empty);

            await page.evaluate(() => {
                fetch('/foo', {
                    method: 'PUT',
                });
            });

            await expect(mock.getRequest()).resolves.toMatchObject({
                method: 'PUT',
            });
        });

        it('mocks fetch PUT request using filter as string with query', async () => {
            await mocketeer.mockPUT('/foo?param=fooParam', response200Ok);

            await page.evaluate(() => {
                fetch('/foo?param=fooParam', { method: 'PUT' })
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });

        it('mocks fetch PUT request using filter object and query object', async () => {
            await mocketeer.mockPUT(requestFooWithQuery, response200Ok);

            await page.evaluate(() => {
                fetch('/foo?param=fooParam', { method: 'PUT' })
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });

        it('mocks fetch DELETE request', async () => {
            const mock = await mocketeer.mockDELETE(
                requestFoo,
                response200Empty
            );

            await page.evaluate(() => {
                fetch('/foo', {
                    method: 'DELETE',
                });
            });

            await expect(mock.getRequest()).resolves.toMatchObject({
                method: 'DELETE',
            });
        });

        it('mocks fetch DELETE request using filter as string with query', async () => {
            await mocketeer.mockDELETE('/foo?param=fooParam', response200Ok);

            await page.evaluate(() => {
                fetch('/foo?param=fooParam', { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });

        it('mocks fetch DELETE request using filter object and query object', async () => {
            await mocketeer.mockDELETE(requestFooWithQuery, response200Ok);

            await page.evaluate(() => {
                fetch('/foo?param=fooParam', { method: 'DELETE' })
                    .then(res => res.json())
                    .then(data => (document.body.innerHTML = data.payload));
            });

            await page.waitFor(100);
            expect(await page.evaluate(() => document.body.innerHTML)).toEqual(
                response200Ok.body.payload
            );
        });
    });

    it('mocks multiple requests', async () => {
        await mocketeer.mockREST(requestGetFoo, response200Empty);

        await page.evaluate(() => {
            fetch('/foo').then(() => (document.body.innerHTML += '1'));
            fetch('/foo').then(() => (document.body.innerHTML += '2'));
        });

        await page.waitFor(100);
        expect(
            await page.evaluate(() => document.body.innerHTML.trim())
        ).toEqual('12');
    });

    it('mocks response with status 500', async () => {
        await mocketeer.mockREST(requestGetFoo, {
            status: 500,
            body: {},
        });

        await page.evaluate(() => {
            fetch('/foo').then(response => {
                document.body.innerHTML = String(response.status);
            });
        });

        await page.waitFor(100);
        expect(
            await page.evaluate(() => document.body.innerHTML.trim())
        ).toEqual('500');
    });

    it('records intercepted request', async () => {
        const mock = await mocketeer.mockREST(requestPostFoo, response200Empty);

        await page.evaluate(() => {
            fetch('/foo', {
                method: 'POST',
                body: JSON.stringify({ payload: 'ok' }),
                headers: {
                    'X-Header': 'FOO',
                },
            });
        });

        await expect(mock.getRequest()).resolves.toMatchObject({
            method: 'POST',
            path: '/foo',
            body: { payload: 'ok' },
            rawBody: JSON.stringify({ payload: 'ok' }),
            url: `http://localhost:${PORT}/foo`,
            headers: {
                'x-header': 'FOO',
            },
        });
    });

    it('.getRequest() rejects when request matching mock was not found', async () => {
        const mock = await mocketeer.addRestMock(
            { method: 'GET', url: '/some_endpoint' },
            { status: 200, body: 'OK' }
        );

        await expect(mock.getRequest(0)).rejects.toMatchObject({
            message: expect.stringMatching(
                /No request matching mock \[\(\d+\) GET \/some_endpoint\] found/
            ),
        });

        await page.evaluate(() => {
            return fetch('/some_endpoint');
        });

        await expect(mock.getRequest(0)).resolves.toEqual(expect.anything());
        await expect(mock.getRequest(1)).rejects.toMatchObject({
            message: expect.stringMatching(
                /2nd request matching mock \[\(\d+\) GET \/some_endpoint\] was not found/
            ),
        });
    });

    it('notifies when mock was called', async () => {
        const mock = await mocketeer.mockREST(requestGetFoo, response200Empty);

        await page.evaluate(() => {
            setTimeout(() => {
                fetch('/foo');
            }, 10);
        });

        await expect(mock.getRequest()).resolves.toBeTruthy();
    });

    it('can set priorities on mocks', async () => {
        const mock = await mocketeer.mockREST(requestGetFoo, response200Empty);

        const mockWithPriority = await mocketeer.mockREST(
            requestGetFoo,
            response200Empty,
            {
                priority: 10,
            }
        );

        await page.evaluate(() => {
            fetch('/foo');
        });

        await page.waitFor(100);

        await expect(mock.getRequest()).rejects.toEqual(expect.anything());
        await expect(mockWithPriority.getRequest()).resolves.toEqual(
            expect.anything()
        );
    });

    it('can remove mock so it is no longer called', async () => {
        const mock = await mocketeer.mockREST(requestGetFoo, {
            status: 200,
            body: { id: 1 },
        });

        await page.evaluate(() => {
            fetch('/foo')
                .then(res => res.json())
                .then(data => (document.body.innerHTML = data.id));
        });

        await page.waitForFunction(
            () => document.body.innerHTML.trim() === '1'
        );

        mocketeer.removeMock(mock);

        await mocketeer.mockREST(requestGetFoo, {
            status: 200,
            body: { id: 2 },
        });

        await page.evaluate(() => {
            fetch('/foo')
                .then(res => res.json())
                .then(data => (document.body.innerHTML = data.id));
        });

        await page.waitForFunction(
            () => document.body.innerHTML.trim() === '2'
        );
    });

    it('can inspect requests that are invoke asynchronously', async () => {
        const mock = await mocketeer.mockREST(requestGetFoo, response200Empty);

        await page.evaluate(() => {
            document.body.innerHTML = 'content';
            document.body.addEventListener('click', () => {
                setTimeout(() => fetch('/foo'), 10);
            });
        });

        await page.click('body');

        await expect(mock.getRequest()).resolves.toEqual(expect.anything());
    });
});

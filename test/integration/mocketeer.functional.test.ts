import { Mocketeer } from '../../src';
import { Browser, launch, Page } from 'puppeteer';
import {
    response200Ok,
    requestGetFoo,
    requestPostFoo,
    response200Empty,
} from './fixture/mock-fixtures';

const PORT = 9000;

describe('Mocketeer functional', () => {
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
        mocketeer = new Mocketeer({ origin: `http://localhost:${PORT}` });
        await mocketeer.activate(page);
    });

    afterEach(async () => {
        await page.close();
    });

    it('mocks fetch GET request', async () => {
        await mocketeer.addRestMock(requestGetFoo, response200Ok);

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

    it('mocks fetch POST request ', async () => {
        await mocketeer.addRestMock(requestPostFoo, response200Ok);

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

    it('mocks multiple requests', async () => {
        await mocketeer.addRestMock(requestGetFoo, response200Empty);

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
        await mocketeer.addRestMock(requestGetFoo, {
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
        const mock = await mocketeer.addRestMock(
            requestPostFoo,
            response200Empty
        );

        await page.evaluate(() => {
            fetch('/foo', {
                method: 'POST',
                body: JSON.stringify({ payload: 'ok' }),
                headers: {
                    'X-Header': 'FOO',
                },
            });
        });

        expect(mock.getRequest()).toMatchObject({
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

    it('notifies when mock was called', async () => {
        const mock = await mocketeer.addRestMock(
            requestGetFoo,
            response200Empty
        );

        await page.evaluate(() => {
            fetch('/foo');
        });

        expect(mock.waitForRequest()).resolves.toBe(undefined);
    });

    it('can set priorities on mocks', async () => {
        const mock = await mocketeer.addRestMock(
            requestGetFoo,
            response200Empty
        );

        const mockWithPriority = await mocketeer.addRestMock(
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

        expect(mock.getRequest()).toBeUndefined();
        expect(mockWithPriority.getRequest()).not.toBeUndefined();
    });

    it('can remove mock so it is no longer called', async () => {
        const mock = await mocketeer.addRestMock(requestGetFoo, {
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

        await mocketeer.addRestMock(requestGetFoo, {
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

    // it.todo('can check if a mock has not been invoked');
});

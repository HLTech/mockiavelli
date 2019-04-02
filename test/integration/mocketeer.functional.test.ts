import {Mocketeer} from "../../src";
import {Browser, launch, Page} from "puppeteer";

const PORT = 9000;

describe('Mocketeer functional', () => {

    let browser: Browser;
    let page: Page;
    let mocketeer: Mocketeer;

    beforeAll(async () => {
        browser = await launch({
            headless: true,
            devtools: false,
            args: ['--no-sandbox']
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
        mocketeer = new Mocketeer({origin: `http://localhost:${PORT}`});
        await mocketeer.activate(page);

    });

    afterEach(async () => {
        await page.close();
    });

    it('mocks fetch GET request' , async () => {
        await mocketeer.addRestMock({
            method: 'GET', path: '/foo'
        }, {
            status: 200,
            body: {payload: "OK"}
        });

        await page.evaluate(() => {
            fetch('/foo')
                .then(res => res.json())
                .then((data) => document.body.innerHTML = data.payload);
        });

        await page.waitFor(100);
        expect(await page.evaluate(() => document.body.innerHTML)).toEqual('OK');
    });

    it('mocks fetch POST request ', async () => {
        await mocketeer.addRestMock({
            method: 'POST',
            path: '/foo'
        }, {
            status: 200,
            body: {payload: "OK"}
        });

        await page.evaluate(() => {
            fetch("/foo", {method: 'POST'})
                .then(res => res.json())
                .then((data) => document.body.innerHTML = data.payload);
        });

        await page.waitFor(100);
        expect(await page.evaluate(() => document.body.innerHTML)).toEqual('OK')
    });

    it('mocks multiple requests' , async () => {
        await mocketeer.addRestMock({
            method: 'GET', path: '/foo'
        }, {
            status: 200,
            body: {}
        });

        await page.evaluate(() => {
            fetch('/foo').then(() => document.body.innerHTML += '1');
            fetch('/foo').then(() => document.body.innerHTML += '2');
        });

        await page.waitFor(100);
        expect(await page.evaluate(() => document.body.innerHTML.trim())).toEqual('12');
    });

    it('mocks response with status 500' , async () => {
         await mocketeer.addRestMock({
            method: 'GET', path: '/foo'
        }, {
            status: 500,
            body: {}
        });

        await page.evaluate(() => {
            fetch('/foo').then(response => {
                document.body.innerHTML = String(response.status)
            })
        });

        await page.waitFor(100);
        expect(await page.evaluate(() => document.body.innerHTML.trim())).toEqual('500');
    });

    it('records intercepted request', async () => {
        const mock = await mocketeer.addRestMock({
            method: 'POST',
            path: '/foo'
        }, {
            status: 200,
            body: {}
        });

        await page.evaluate(() => {
            fetch("/foo", {
                method: 'POST',
                body: JSON.stringify({payload: 'ok'}),
                headers: {
                    'X-Header': 'FOO'
                }
            })
        });

        expect(mock.getRequest()).toMatchObject({
            method: 'POST',
            path: '/foo',
            body: {payload: 'ok'},
            rawBody: JSON.stringify({payload: 'ok'}),
            url: `http://localhost:${PORT}/foo`,
            headers: {
                'x-header': 'FOO'
            }
        })
    });

    // it.todo('can check if a mock has not been invoked');

});

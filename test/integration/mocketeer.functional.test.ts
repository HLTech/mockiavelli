import {Mocketeer} from "../../build";
import {startServer} from "./utils/server";
import {Browser, launch, Page} from "puppeteer";

describe('Mocketeer functional', () => {

    let browser: Browser;
    let page: Page;
    let mocketeer: Mocketeer;

    beforeAll(async () => {
        await startServer(9000);
        browser = await launch({
            headless: true,
            devtools: false,
            args: ['--no-sandbox']
        });
    });

    beforeEach(async () => {
        page = await browser.newPage();
        await page.goto('http://localhost:9000');
    });

    afterEach(async () => {
        try {
            await page.close();
        } catch (e) {

        }
    });

    beforeEach(async () => {
        mocketeer = new Mocketeer({origin: 'http://localhost:9000'});
        await mocketeer.activate(page)
    });

    it('mocks GET request with JSON payload' , async () => {
        await mocketeer.addRestMock({
            method: 'GET', path: '/foo'
        }, {
            status: 200,
            body: {payload: "OK"}
        });

        await page.evaluate(() => {
            fetch('/foo').then(res => res.json())
                .then((data) => document.querySelector('body').innerHTML = data.payload);
        });

        await page.waitFor(100);
        expect(await page.evaluate(() => document.querySelector("body").innerHTML)).toEqual('OK')
    });

});

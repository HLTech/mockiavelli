import { Browser, launch, Page } from 'puppeteer';
import { Mocketeer } from '../../../src';
import { makeRequestFactory } from '../test-helpers/make-request-factory';

const PORT = 9000;

export function setupPuppeteerCtx() {
    let browser: Browser;

    const testCtx: {
        page?: Page;
        mocketeer?: Mocketeer;
        makeRequest?: ReturnType<typeof makeRequestFactory>;
    } = {};

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
        testCtx.page = await browser.newPage();
        await testCtx.page.goto(`http://localhost:${PORT}`);

        // Instantiate Mocketeer
        testCtx.mocketeer = await Mocketeer.setup(testCtx.page);
        testCtx.makeRequest = makeRequestFactory(testCtx.page);
    });

    afterEach(async () => {
        await testCtx.page.close();
    });

    return testCtx;
}

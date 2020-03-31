import playwright from 'playwright';
import { Mocketeer } from '../../../src';
import { makeRequestFactory } from '../test-helpers/make-request-factory';

const PORT = 9000;

export function setupPlaywrightCtx() {
    let browser: playwright.Browser;
    let context: playwright.BrowserContext;

    const testCtx: {
        page?: playwright.Page;
        mocketeer?: Mocketeer;
        makeRequest?: ReturnType<typeof makeRequestFactory>;
    } = {};

    beforeAll(async () => {
        browser = await playwright.chromium.launch({
            headless: true,
            devtools: false,
            args: ['--no-sandbox'],
        });
        context = await browser.newContext();
    });

    afterAll(async () => {
        await browser.close();
    });

    beforeEach(async () => {
        // Setup new page (tab)
        testCtx.page = await context.newPage();
        await testCtx.page.goto(`http://localhost:${PORT}`);
        testCtx.mocketeer = await Mocketeer.setup(testCtx.page);
        testCtx.makeRequest = makeRequestFactory(testCtx.page);
    });

    afterEach(async () => {
        await testCtx.page.close();
    });

    return testCtx;
}

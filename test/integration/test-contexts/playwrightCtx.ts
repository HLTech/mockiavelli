import { chromium, BrowserContext, Page, Browser } from 'playwright-chromium';
import { Mocketeer } from '../../../src';
import { makeRequest } from '../test-helpers/make-request';

const PORT = 9000;

export interface PlaywrightTestCtx {
    page?: Page;
    mocketeer?: Mocketeer;
    makeRequest?: ReturnType<typeof makeRequestFactory>;
}

export function setupPlaywrightCtx(): PlaywrightTestCtx {
    let browser: Browser;
    let context: BrowserContext;

    const testCtx: PlaywrightTestCtx = {};

    beforeAll(async () => {
        browser = await chromium.launch({
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

function makeRequestFactory(page: Page) {
    return (
        method: string,
        url: string,
        headers?: Record<string, string>,
        body?: any,
        options?: { waitForRequestEnd: boolean }
    ): ReturnType<typeof makeRequest> =>
        page.evaluate(makeRequest, {
            url,
            method,
            headers,
            body,
            options,
        });
}

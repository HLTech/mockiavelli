import { Browser, launch, Page } from 'puppeteer';
import { Mocketeer } from '../../../src';
import { makeRequest } from '../test-helpers/make-request';

const PORT = 9000;

export interface PuppeteerTestCtx {
    page?: Page;
    mocketeer?: Mocketeer;
    makeRequest?: ReturnType<typeof makeRequestFactory>;
}

export function setupPuppeteerCtx() {
    let browser: Browser;

    const testCtx: PuppeteerTestCtx = {};

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

import { setupPlaywrightCtx } from './playwrightCtx';
import { setupPuppeteerCtx } from './puppeteerCtx';

const DEFAULT_CTX = 'puppeteer';

export function setupTestCtx(controller = DEFAULT_CTX) {
    console.log(`Creating ${controller} test context`);
    if (controller === 'playwright') {
        return setupPlaywrightCtx();
    } else if (controller === 'puppeteer') {
        return setupPuppeteerCtx();
    } else {
        throw new Error('Unsupported controller ' + controller);
    }
}

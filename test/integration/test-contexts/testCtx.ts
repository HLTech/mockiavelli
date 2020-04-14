import { setupPlaywrightCtx } from './playwrightCtx';
import { setupPuppeteerCtx } from './puppeteerCtx';

export function setupTestCtx(controller) {
    if (controller === 'playwright') {
        return setupPlaywrightCtx();
    } else if (controller === 'puppeteer') {
        return setupPuppeteerCtx();
    } else {
        throw new Error('Unsupported controller ' + controller);
    }
}

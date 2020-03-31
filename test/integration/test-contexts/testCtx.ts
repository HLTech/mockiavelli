import { setupPlaywrightCtx } from './playwrightCtx';
import { setupPuppeteerCtx } from './puppeteerCtx';
import * as puppeteer from 'puppeteer';
import playwright from 'playwright';
import { Mocketeer } from '../../../src';
import { makeRequestFactory } from '../test-helpers/make-request-factory';

export type TestCtx = {
    page?: puppeteer.Page | playwright.Page;
    mocketeer?: Mocketeer;
    makeRequest?: ReturnType<typeof makeRequestFactory>;
};

export function setupTestCtx(adapter): TestCtx {
    if (adapter === 'playwright') {
        return setupPlaywrightCtx();
    } else {
        return setupPuppeteerCtx();
    }
}

import * as puppeteer from 'puppeteer';
import playwright from 'playwright-chromium';
import { PlaywrightController } from './PlaywrightController';
import { PuppeteerController } from './PuppeteerController';
import { BrowserController, BrowserRequestHandler } from './BrowserController';

/**
 * Type of supported page objects
 */
export type BrowserPage = puppeteer.Page | playwright.Page;

export class BrowserControllerFactory {
    /**
     * Returns instance of BrowserController corresponding to provided page
     */
    public static createForPage(
        page: BrowserPage,
        onRequest: BrowserRequestHandler
    ): BrowserController {
        if (this.isPlaywrightPage(page)) {
            return new PlaywrightController(page, onRequest);
        } else if (this.isPuppeteerPage(page)) {
            return new PuppeteerController(page, onRequest);
        } else {
            throw new Error(
                'Expected instance of Puppeteer or Playwright Page. Got: ' +
                    page
            );
        }
    }

    private static isPlaywrightPage(page: any): page is playwright.Page {
        return typeof page['route'] === 'function';
    }

    private static isPuppeteerPage(page: any): page is puppeteer.Page {
        return typeof page['setRequestInterception'] === 'function';
    }
}

import * as puppeteer from 'puppeteer';
import playwright from 'playwright';
import { PlaywrightController } from './PlaywrightController';
import { PuppeteerController } from './PuppeteerController';
import { BrowserController } from './BrowserController';

export type BrowserPage = puppeteer.Page | playwright.Page;

export class BrowserControllerFactory {
    /**
     * Return instantiated Playwright or Puppeteer controller
     * corresponding to provided page object
     */
    public static getForPage(page: BrowserPage): BrowserController {
        if (this.isPlaywrightPage(page)) {
            return new PlaywrightController(page);
        } else if (this.isPuppeteerPage(page)) {
            return new PuppeteerController(page);
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

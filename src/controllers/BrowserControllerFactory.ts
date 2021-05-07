import { PlaywrightController, PlaywrightPage } from './PlaywrightController';
import { PuppeteerController, PuppeteerPage } from './PuppeteerController';
import { BrowserController, BrowserRequestHandler } from './BrowserController';

/**
 * Type of supported page objects
 */
export type BrowserPage = PlaywrightPage | PuppeteerPage;

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

    private static isPlaywrightPage(page: any): page is PlaywrightPage {
        return typeof page['route'] === 'function';
    }

    private static isPuppeteerPage(page: any): page is PuppeteerPage {
        return typeof page['setRequestInterception'] === 'function';
    }
}

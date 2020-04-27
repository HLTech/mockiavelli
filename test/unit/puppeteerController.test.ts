import { PuppeteerController } from '../../src/controllers/PuppeteerController';
import { createMockPage } from './fixtures/page';
import { PuppeteerRequestMock } from './fixtures/PuppeteerRequest';

describe('PuppeteerAdapter', () => {
    test('.start() subscribes for page request event', async () => {
        const page = createMockPage();
        const adapter = new PuppeteerController(page);
        await adapter.startInterception(() => {});
        expect(page.setRequestInterception).toHaveBeenCalledWith(true);
        expect(page.on).toHaveBeenCalledWith('request', expect.any(Function));
    });

    test('returns serialized request object', async () => {
        const page = createMockPage();
        const adapter = new PuppeteerController(page);
        const handler = jest.fn();
        await adapter.startInterception(handler);

        // Trigger request
        page.on.mock.calls[0][1](
            PuppeteerRequestMock.create({
                postData: JSON.stringify({ foo: 'bar' }),
                url: 'http://example.com:8000/some/path?foo=bar#baz',
                method: 'GET',
                headers: { header: 'header' },
                resourceType: 'xhr',
            })
        );

        expect(handler).toHaveBeenCalledWith(
            {
                headers: {
                    header: 'header',
                },
                hostname: 'http://example.com:8000',
                method: 'GET',
                path: '/some/path',
                query: {
                    foo: 'bar',
                },
                body: {
                    foo: 'bar',
                },
                sourceOrigin: 'http://example.com:8000',
                type: 'xhr',
                url: 'http://example.com:8000/some/path?foo=bar#baz',
            },
            expect.anything(),
            expect.anything()
        );
    });

    test('returns correct path and url when origin contains trailing slash', async () => {
        const page = createMockPage();
        const adapter = new PuppeteerController(page);
        const handler = jest.fn();
        await adapter.startInterception(handler);

        // Trigger request
        page.on.mock.calls[0][1](
            PuppeteerRequestMock.create({
                url: 'http://origin:8000/some/path',
            })
        );

        expect(handler).toHaveBeenCalledWith(
            expect.objectContaining({
                url: 'http://origin:8000/some/path',
                path: '/some/path',
            }),
            expect.anything(),
            expect.anything()
        );
    });
});

import { Mocketeer } from '../../src';
import { createMockPage } from './fixtures/page';
import { createMockRequest } from './fixtures/request';

describe('Mocketeer', () => {
    describe('.activate', () => {
        it('.calls page.setRequestInterception and page.on ', async () => {
            const mocketeer = new Mocketeer();
            const page = createMockPage();
            await mocketeer.activate(page);
            expect(page.setRequestInterception).toHaveBeenCalledWith(true);
            expect(page.on).toHaveBeenCalledWith(
                'request',
                expect.any(Function)
            );
        });
    });

    describe('setup()', () => {
        it('returns a promise resolving to instance of Mocketeer', async () => {
            const page = createMockPage();
            await expect(Mocketeer.setup(page)).resolves.toBeInstanceOf(
                Mocketeer
            );
        });

        it('.calls page.setRequestInterception and page.on ', async () => {
            const page = createMockPage();
            await Mocketeer.setup(page);
            expect(page.setRequestInterception).toHaveBeenCalledWith(true);
            expect(page.on).toHaveBeenCalledWith(
                'request',
                expect.any(Function)
            );
        });
    });

    describe('on "request"', () => {
        let page: ReturnType<typeof createMockPage>;

        beforeEach(async () => {
            page = createMockPage();
            const mocketeer = new Mocketeer({ debug: true });
            await mocketeer.activate(page as any);
        });

        test('calls continue request of unsupported resource type ', () => {
            const callback = page.on.mock.calls[0][1];
            const request = createMockRequest();
            request.resourceType.mockReturnValue('image');
            callback(request);
            expect(request.continue).toHaveBeenCalled();
        });
    });
});

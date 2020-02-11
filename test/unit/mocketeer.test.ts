import { Mocketeer, Mock } from '../../src';
import { createMockPage } from './fixtures/page';
import { Request } from './fixtures/request';
jest.mock('../../src/mock');

describe('Mocketeer', () => {
    describe('.activate', () => {
        it('.calls page.setRequestInterception and page.on ', async () => {
            const page = createMockPage();
            await Mocketeer.setup(page as any);
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
            await Mocketeer.setup(page);
        });

        test('calls continue request of unsupported resource type ', () => {
            const callback = page.on.mock.calls[0][1];
            const request = Request.create({ resourceType: 'image' });
            callback(request);
            expect(request.continue).toHaveBeenCalled();
        });
    });

    describe('mock http methods', () => {
        let mocketeer: Mocketeer;
        const url = 'url';
        const filter = { url };
        const filterWithQuery = {
            url,
            query: {
                param: 'fooParam',
            },
        };
        const mockResponse = { status: 404, body: {} };

        beforeEach(async () => {
            mocketeer = new Mocketeer();
        });

        test('should create RestMock using GET method and filter as object', () => {
            mocketeer.mockGET(filter, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({ method: 'GET', ...filter }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using GET method with filter and query as objects', () => {
            mocketeer.mockGET(filterWithQuery, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'GET',
                    ...filterWithQuery,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using GET method and filter as url string', () => {
            mocketeer.mockGET(url, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({ method: 'GET', ...filter }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using POST method and filter as object', () => {
            mocketeer.mockPOST(filter, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'POST',
                    ...filter,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using POST method with filter and query as objects', () => {
            mocketeer.mockPOST(filterWithQuery, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'POST',
                    ...filterWithQuery,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using POST method and filter as url string', () => {
            mocketeer.mockPOST(url, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'POST',
                    ...filter,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using PUT method and filter as object', () => {
            mocketeer.mockPUT(filter, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({ method: 'PUT', ...filter }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using PUT method with filter and query as objects', () => {
            mocketeer.mockPUT(filterWithQuery, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'PUT',
                    ...filterWithQuery,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using PUT method and filter as url string', () => {
            mocketeer.mockPUT(url, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({ method: 'PUT', ...filter }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using DELETE method and filter as object', () => {
            mocketeer.mockDELETE(filter, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'DELETE',
                    ...filter,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using DELETE method with filter and query as objects', () => {
            mocketeer.mockDELETE(filterWithQuery, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'DELETE',
                    ...filterWithQuery,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using DELETE method and filter as url string', () => {
            mocketeer.mockDELETE(url, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'DELETE',
                    ...filter,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using PATCH method and filter as url string', () => {
            mocketeer.mockPATCH(url, mockResponse);
            expect(Mock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'PATCH',
                    ...filter,
                }),
                mockResponse,
                expect.anything()
            );
        });
    });
});

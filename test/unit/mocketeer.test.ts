import {
    Mocketeer,
    RequestMethodFilter,
    REST_METHOD,
    RestMock,
} from '../../src';
import { createMockPage } from './fixtures/page';
import { createMockRequest } from './fixtures/request';
jest.mock('../../src/rest-mock');

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

    describe('mock http methods', () => {
        let mocketeer: Mocketeer;
        const url = 'url';
        const filter: RequestMethodFilter = { url };
        const filterWithQuery: RequestMethodFilter = {
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
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({ method: REST_METHOD.GET, ...filter }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using GET method with filter and query as objects', () => {
            mocketeer.mockGET(filterWithQuery, mockResponse);
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: REST_METHOD.GET,
                    ...filterWithQuery,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using GET method and filter as url string', () => {
            mocketeer.mockGET(url, mockResponse);
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({ method: REST_METHOD.GET, ...filter }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using POST method and filter as object', () => {
            mocketeer.mockPOST(filter, mockResponse);
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: REST_METHOD.POST,
                    ...filter,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using POST method with filter and query as objects', () => {
            mocketeer.mockPOST(filterWithQuery, mockResponse);
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: REST_METHOD.POST,
                    ...filterWithQuery,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using POST method and filter as url string', () => {
            mocketeer.mockPOST(url, mockResponse);
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: REST_METHOD.POST,
                    ...filter,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using PUT method and filter as object', () => {
            mocketeer.mockPUT(filter, mockResponse);
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({ method: REST_METHOD.PUT, ...filter }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using PUT method with filter and query as objects', () => {
            mocketeer.mockPUT(filterWithQuery, mockResponse);
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: REST_METHOD.PUT,
                    ...filterWithQuery,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using PUT method and filter as url string', () => {
            mocketeer.mockPUT(url, mockResponse);
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({ method: REST_METHOD.PUT, ...filter }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using DELETE method and filter as object', () => {
            mocketeer.mockDELETE(filter, mockResponse);
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: REST_METHOD.DELETE,
                    ...filter,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using DELETE method with filter and query as objects', () => {
            mocketeer.mockDELETE(filterWithQuery, mockResponse);
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: REST_METHOD.DELETE,
                    ...filterWithQuery,
                }),
                mockResponse,
                expect.anything()
            );
        });

        test('should create RestMock using DELETE method and filter as url string', () => {
            mocketeer.mockDELETE(url, mockResponse);
            expect(RestMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: REST_METHOD.DELETE,
                    ...filter,
                }),
                mockResponse,
                expect.anything()
            );
        });
    });
});

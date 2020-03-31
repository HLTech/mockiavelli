import { Mocketeer, Mock } from '../../src';
import { createMockPage } from './fixtures/page';
jest.mock('../../src/mock');
jest.mock('../../src/controllers/BrowserControllerFactory', () => ({
    BrowserControllerFactory: class {
        static getForPage = jest.fn().mockReturnValue({
            startInterception: jest.fn(),
        });
    },
}));

describe('Mocketeer', () => {
    describe('setup()', () => {
        it('returns a promise resolving to instance of Mocketeer', async () => {
            const page = createMockPage();
            await expect(Mocketeer.setup(page)).resolves.toBeInstanceOf(
                Mocketeer
            );
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

import { Mockiavelli, Mock } from '../../src';
import { createMockPage } from './fixtures/page';
jest.mock('../../src/mock');
jest.mock('../../src/controllers/BrowserControllerFactory', () => ({
    BrowserControllerFactory: class {
        static createForPage = jest.fn().mockReturnValue({
            startInterception: jest.fn(),
        });
    },
}));

describe('Mockiavelli', () => {
    describe('setup()', () => {
        test('returns a promise resolving to instance of Mockiavelli', async () => {
            const page = createMockPage();
            await expect(Mockiavelli.setup(page)).resolves.toBeInstanceOf(
                Mockiavelli
            );
        });
    });

    describe('mock http methods', () => {
        let mockiavelli: Mockiavelli;
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
            mockiavelli = new Mockiavelli();
        });

        describe('mock()', () => {
            test('should add API base url to request matcher', () => {
                const mockiavelli = new Mockiavelli({ baseUrl: '/api/foo' });
                mockiavelli.mock({ url: '/boo', method: 'GET' }, mockResponse);
                expect(Mock).toHaveBeenCalledWith(
                    { url: '/api/foo/boo', method: 'GET' },
                    mockResponse,
                    expect.anything()
                );
            });
        });

        describe('mockGET()', () => {
            test('should create RestMock using GET method and filter as object', () => {
                mockiavelli.mockGET(filter, mockResponse);
                expect(Mock).toHaveBeenCalledWith(
                    expect.objectContaining({ method: 'GET', ...filter }),
                    mockResponse,
                    expect.anything()
                );
            });

            test('should create RestMock using GET method with filter and query as objects', () => {
                mockiavelli.mockGET(filterWithQuery, mockResponse);
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
                mockiavelli.mockGET(url, mockResponse);
                expect(Mock).toHaveBeenCalledWith(
                    expect.objectContaining({ method: 'GET', ...filter }),
                    mockResponse,
                    expect.anything()
                );
            });
        });

        describe('mockPOST()', () => {
            test('should create RestMock using POST method and filter as object', () => {
                mockiavelli.mockPOST(filter, mockResponse);
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
                mockiavelli.mockPOST(filterWithQuery, mockResponse);
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
                mockiavelli.mockPOST(url, mockResponse);
                expect(Mock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        method: 'POST',
                        ...filter,
                    }),
                    mockResponse,
                    expect.anything()
                );
            });
        });

        describe('mockPUT()', () => {
            test('should create RestMock using PUT method and filter as object', () => {
                mockiavelli.mockPUT(filter, mockResponse);
                expect(Mock).toHaveBeenCalledWith(
                    expect.objectContaining({ method: 'PUT', ...filter }),
                    mockResponse,
                    expect.anything()
                );
            });

            test('should create RestMock using PUT method with filter and query as objects', () => {
                mockiavelli.mockPUT(filterWithQuery, mockResponse);
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
                mockiavelli.mockPUT(url, mockResponse);
                expect(Mock).toHaveBeenCalledWith(
                    expect.objectContaining({ method: 'PUT', ...filter }),
                    mockResponse,
                    expect.anything()
                );
            });
        });

        describe('mockDELETE()', () => {
            test('should create RestMock using DELETE method and filter as object', () => {
                mockiavelli.mockDELETE(filter, mockResponse);
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
                mockiavelli.mockDELETE(filterWithQuery, mockResponse);
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
                mockiavelli.mockDELETE(url, mockResponse);
                expect(Mock).toHaveBeenCalledWith(
                    expect.objectContaining({
                        method: 'DELETE',
                        ...filter,
                    }),
                    mockResponse,
                    expect.anything()
                );
            });
        });

        describe('mockPUT()', () => {
            test('should create RestMock using PATCH method and filter as url string', () => {
                mockiavelli.mockPATCH(url, mockResponse);
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
});

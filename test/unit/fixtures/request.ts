import { Request } from 'puppeteer';
import { MockOptions, RequestMatcherObject, Mock } from '../../../src';

export const createMockRequest = (): jest.Mocked<Request> => ({
    postData: jest.fn().mockReturnValue(''),
    url: jest.fn().mockReturnValue(''),
    method: jest.fn().mockReturnValue(''),
    headers: jest.fn().mockReturnValue({}),
    resourceType: jest.fn().mockReturnValue(''),
    abort: jest.fn(),
    continue: jest.fn(),
    failure: jest.fn(),
    isNavigationRequest: jest.fn(),
    frame: jest.fn(),
    redirectChain: jest.fn(),
    respond: jest.fn(),
    response: jest.fn(),
});

const a = createMockRequest();

a.headers.mockReturnValue({ a: '' });

const mockedResponse = {
    status: 200,
    body: {},
};

export const createRestMock = (
    change: Partial<RequestMatcherObject> = {},
    options?: Partial<MockOptions>
) => {
    return new Mock(
        {
            url: '/foo',
            method: 'GET',
            ...change,
        },
        mockedResponse,
        options
    );
};

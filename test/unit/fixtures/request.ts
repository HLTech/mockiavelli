import { Mock, MockOptions, RequestMatcher } from '../../../src';

const mockedResponse = {
    status: 200,
    body: {},
};

export const createRestMock = (
    change: Partial<RequestMatcher> = {},
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

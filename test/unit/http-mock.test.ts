import { RequestFilter, RestMock } from '../../src';

const mockedResponse = {
    status: 200,
    body: {},
};

const createRestMock = (change: Partial<RequestFilter> = {}) => {
    return new RestMock(
        {
            url: '/foo',
            method: 'GET',
            ...change,
        },
        mockedResponse
    );
};

test('.getResponseForRequest matches GET request', () => {
    const mock = createRestMock();

    expect(
        mock.getResponseForRequest(
            {
                path: '/foo',
                method: 'GET',
                url: 'http://example/foo',
                type: 'xhr',
                headers: {},
                query: {},
                hostname: 'http://example',
            },
            'http://example'
        )
    ).not.toBeNull();
});

test('.getResponseForRequest matches GET request when query params passed as an argument', () => {
    const mock = createRestMock({
        query: {
            example: 'firstExample',
            secondExample: 'secondExampleParam',
        },
    });

    expect(
        mock.getResponseForRequest(
            {
                path: '/foo',
                method: 'GET',
                url:
                    'http://example/foo?example=firstExample&secondExample=SecondExampleParam',
                type: 'xhr',
                headers: {},
                query: {
                    example: 'firstExample',
                    secondExample: 'secondExampleParam',
                },
                hostname: 'http://example',
            },
            'http://example'
        )
    ).not.toBeNull();
});

test('.getResponseForRequest matches GET request when query params are numbers', () => {
    const mock = createRestMock({
        query: {
            exampleNum: '111',
        },
    });

    expect(
        mock.getResponseForRequest(
            {
                path: '/foo',
                method: 'GET',
                url: 'http://example/foo?exampleNum=111',
                type: 'xhr',
                headers: {},
                query: {
                    exampleNum: '111',
                },
                hostname: 'http://example',
            },
            'http://example'
        )
    ).not.toBeNull();
});

test('.getResponseForRequest matches GET request when query params are arrays', () => {
    const mock = createRestMock({
        query: {
            exampleArray: ['122', '3223'],
        },
    });

    expect(
        mock.getResponseForRequest(
            {
                path: '/foo',
                method: 'GET',
                url: 'http://example/foo?exampleArray=122&exampleArray=3223',
                type: 'xhr',
                headers: {},
                query: {
                    exampleArray: ['122', '3223'],
                },
                hostname: 'http://example',
            },
            'http://example'
        )
    ).not.toBeNull();
});

test('.getResponseForRequest does not match GET request when some query params are missing from the actual request', () => {
    const mock = createRestMock({
        query: {
            example: 'exampleParam',
            secondExample: 'secondExampleParam',
        },
    });

    expect(
        mock.getResponseForRequest(
            {
                path: '/foo',
                method: 'GET',
                url: 'http://example/foo?example=exampleParam',
                type: 'xhr',
                headers: {},
                query: {
                    example: 'exampleParam',
                },
                hostname: 'http://example',
            },
            'http://example'
        )
    ).toBeNull();
});

test('.getResponseForRequest does not match GET request when query params values are different', () => {
    const mock = createRestMock({
        query: {
            example: 'exampleParamFoo',
        },
    });

    expect(
        mock.getResponseForRequest(
            {
                path: '/foo',
                method: 'GET',
                url: 'http://example/foo?example=exampleParam',
                type: 'xhr',
                headers: {},
                query: {
                    example: 'exampleParam',
                },
                hostname: 'http://example',
            },
            'http://example'
        )
    ).toBeNull();
});

test('.getResponseForRequest matches GET request with query params passed in the url', () => {
    const mock = createRestMock({
        url: '/foo?example=exampleParam',
    });

    expect(
        mock.getResponseForRequest(
            {
                path: '/foo',
                method: 'GET',
                url: 'http://example/foo?example=exampleParam',
                type: 'xhr',
                headers: {},
                query: {
                    example: 'exampleParam',
                },
                hostname: 'http://example',
            },
            'http://example'
        )
    ).not.toBeNull();
});

test('.getResponseForRequest matches GET request with specified origin', () => {
    const mock = createRestMock({
        url: 'http://example/foo',
    });

    expect(
        mock.getResponseForRequest(
            {
                path: '/foo',
                method: 'GET',
                url: 'http://example/foo',
                type: 'xhr',
                headers: {},
                query: {},
                hostname: 'http://example',
            },
            'http://example'
        )
    ).not.toBeNull();
});

test('.getResponseForRequest does not match GET request with specified origin', () => {
    const mock = createRestMock({
        url: 'http://barExample/foo',
    });

    expect(
        mock.getResponseForRequest(
            {
                path: '/foo',
                method: 'GET',
                url: 'http://fooExample/foo',
                type: 'xhr',
                headers: {},
                query: {},
                hostname: 'http://fooExample',
            },
            'http://localhost'
        )
    ).toBeNull();
});

test('.getResponseForRequest does not match GET request when pageOrigin is different than the request hostname', () => {
    const mock = createRestMock();

    expect(
        mock.getResponseForRequest(
            {
                path: '/foo',
                method: 'GET',
                url: 'http://fooExample/foo',
                type: 'xhr',
                headers: {},
                query: {},
                hostname: 'http://fooExample',
            },
            'http://localhost'
        )
    ).toBeNull();
});

test('.sortByPriroty can be used to correctly sort mocks', () => {
    const filter = {
        url: '/foo',
        method: 'GET',
    };

    let response = {
        status: 200,
        body: {},
    };

    const mockDefault = new RestMock(filter, response);
    const mock10 = new RestMock(filter, response, {
        priority: 10,
    });
    const mock5 = new RestMock(filter, response, {
        priority: 5,
    });

    expect([mockDefault, mock10, mock5].sort(RestMock.sortByPriority)).toEqual([
        mock10,
        mock5,
        mockDefault,
    ]);

    expect([mockDefault, mock5, mock10].sort(RestMock.sortByPriority)).toEqual([
        mock10,
        mock5,
        mockDefault,
    ]);

    expect([mock10, mock5, mockDefault].sort(RestMock.sortByPriority)).toEqual([
        mock10,
        mock5,
        mockDefault,
    ]);
});

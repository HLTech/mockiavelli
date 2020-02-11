import { createRestMock, Request } from './fixtures/request';
import { Mock } from '../../src';

test('.getResponseForRequest matches GET request', () => {
    const mock = createRestMock();

    expect(
        mock.getResponseForRequest(
            Request.create({
                url: 'http://example/foo',
            })
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
            Request.create({
                url:
                    'http://example/foo?example=firstExample&secondExample=secondExampleParam',
            })
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
            Request.create({
                url: 'http://example/foo?exampleNum=111',
            })
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
            Request.create({
                url: 'http://example/foo?exampleArray=122&exampleArray=3223',
            })
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
            Request.create({
                url: 'http://example/foo?example=exampleParam',
            })
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
            Request.create({
                url: 'http://example/foo?example=exampleParam',
            })
        )
    ).toBeNull();
});

test('.getResponseForRequest matches GET request with query params passed in the url', () => {
    const mock = createRestMock({
        url: '/foo?example=exampleParam',
    });

    expect(
        mock.getResponseForRequest(
            Request.create({
                url: 'http://example/foo?example=exampleParam',
            })
        )
    ).not.toBeNull();
});

test('.getResponseForRequest matches GET request with specified origin', () => {
    const mock = createRestMock({
        url: 'http://example/foo',
    });

    expect(
        mock.getResponseForRequest(
            Request.create({
                url: 'http://example/foo',
            })
        )
    ).not.toBeNull();
});

test('.getResponseForRequest does not match GET request with specified origin', () => {
    const mock = createRestMock({
        url: 'http://barExample/foo',
    });

    expect(
        mock.getResponseForRequest(
            Request.create({
                url: 'http://fooExample/foo',
                origin: 'http://localhost',
            })
        )
    ).toBeNull();
});

test('.getResponseForRequest does not match GET request when pageOrigin is different than the request hostname', () => {
    const mock = createRestMock();

    expect(
        mock.getResponseForRequest(
            Request.create({
                url: 'http://fooExample/foo',
                origin: 'http://localhost',
            })
        )
    ).toBeNull();
});

test('.getResponseForRequest matches GET request first time when once option is set to true', () => {
    const mock = createRestMock(undefined, { once: true });

    expect(
        mock.getResponseForRequest(
            Request.create({
                url: 'http://example/foo',
            })
        )
    ).not.toBeNull();
});

test('.getResponseForRequest does not match second GET request when once option is set to true', () => {
    const mock = createRestMock(undefined, { once: true });
    const exampleRequest = Request.create({
        url: 'http://example/foo',
    });
    mock.getResponseForRequest(exampleRequest);

    expect(mock.getResponseForRequest(exampleRequest)).toBeNull();
});

test('.getResponseForRequest matches GET request with path variable', () => {
    const mock = createRestMock({ url: '/foo/:id' });
    const exampleRequest = Request.create({
        url: 'http://example/foo/param',
    });
    mock.getResponseForRequest(exampleRequest);

    expect(mock.getResponseForRequest(exampleRequest)).not.toBeNull();
});

test('.getResponseForRequest matches GET request with multiple path variables', () => {
    const mock = createRestMock({ url: '/foo/:id/:resource' });
    const exampleRequest = Request.create({
        url: 'http://example/foo/param/second',
    });
    mock.getResponseForRequest(exampleRequest);

    expect(mock.getResponseForRequest(exampleRequest)).not.toBeNull();
});

test('.getResponseForRequest does not match GET request when path variables are set and not present in request', () => {
    const mock = createRestMock({ url: '/foo/:id' });
    const exampleRequest = Request.create({
        url: 'http://example/foo',
    });
    mock.getResponseForRequest(exampleRequest);

    expect(mock.getResponseForRequest(exampleRequest)).toBeNull();
});

test('.getResponseForRequest returns truthy when filter.body matches request body ', () => {
    const mock = new Mock(
        {
            method: 'GET',
            url: '/example',
            body: {
                key: 'value',
            },
        },
        { status: 200 }
    );
    const matchingRequest = Request.create({
        url: '/example',
        postData: JSON.stringify({
            key: 'value',
        }),
    });
    const nonMatchingRequest = Request.create({
        url: '/example',
        postData: JSON.stringify({
            key: 'another',
        }),
    });
    expect(mock.getResponseForRequest(matchingRequest)).toBeTruthy();
    expect(mock.getResponseForRequest(nonMatchingRequest)).toBeFalsy();
});

test('.getResponseForRequest returns truthy when filter.body matches request body regardless of key order ', () => {
    const mock = new Mock(
        {
            method: 'GET',
            url: '/example',
            body: {
                key1: 'value1',
                key2: 'value2',
            },
        },
        { status: 200 }
    );
    const matchingRequest = Request.create({
        url: '/example',
        postData: JSON.stringify({
            key2: 'value2',
            key1: 'value1',
        }),
    });
    expect(mock.getResponseForRequest(matchingRequest)).toBeTruthy();
});

test('.getResponseForRequest returns truthy when filter body matches request body and body is string', () => {
    const mock = new Mock(
        {
            method: 'GET',
            url: '/example',
            body: 'body_value',
        },
        { status: 200 }
    );
    const matchingRequest = Request.create({
        url: '/example',
        postData: 'body_value',
    });
    expect(mock.getResponseForRequest(matchingRequest)).toBeTruthy();
});

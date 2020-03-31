import { createRestMock } from './fixtures/request';
import { Mock } from '../../src';
import { browserRequest } from './fixtures/browserRequest';

test('.getResponseForRequest matches GET request', () => {
    const mock = createRestMock();
    expect(
        mock.getResponseForRequest(
            browserRequest.build({ url: 'http://example.com/foo' })
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
            browserRequest.build({
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
            browserRequest.build({
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
            browserRequest.build({
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
            browserRequest.build({
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
            browserRequest.build({
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
            browserRequest.build({
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
            browserRequest.build({
                url: 'http://example/foo',
            })
        )
    ).not.toBeNull();
});

test('.getResponseForRequest does not match GET request with specified origin', () => {
    const mock = createRestMock({
        url: 'http://example.com/foo',
    });

    expect(
        mock.getResponseForRequest(
            browserRequest.build({
                url: 'http://foo.example.com/foo',
                sourceOrigin: 'http://bar.example.com',
            })
        )
    ).toBeNull();
});

test('.getResponseForRequest does not match GET request when pageOrigin is different than the request hostname', () => {
    const mock = createRestMock();

    expect(
        mock.getResponseForRequest(
            browserRequest.build({
                url: 'http://fooExample/foo',
                sourceOrigin: 'http://localhost',
            })
        )
    ).toBeNull();
});

test('.getResponseForRequest matches GET request first time when once option is set to true', () => {
    const mock = createRestMock(undefined, { once: true });

    expect(
        mock.getResponseForRequest(
            browserRequest.build({
                url: 'http://example/foo',
            })
        )
    ).not.toBeNull();
});

test('.getResponseForRequest does not match second GET request when once option is set to true', () => {
    const mock = createRestMock(undefined, { once: true });
    const exampleRequest = browserRequest.build({
        url: 'http://example/foo',
    });
    mock.getResponseForRequest(exampleRequest);

    expect(mock.getResponseForRequest(exampleRequest)).toBeNull();
});

test('.getResponseForRequest matches GET request with path variable', () => {
    const mock = createRestMock({ url: '/foo/:id' });
    const exampleRequest = browserRequest.build({
        url: 'http://example/foo/param',
    });
    mock.getResponseForRequest(exampleRequest);

    expect(mock.getResponseForRequest(exampleRequest)).not.toBeNull();
});

test('.getResponseForRequest matches GET request with multiple path variables', () => {
    const mock = createRestMock({ url: '/foo/:id/:resource' });
    const exampleRequest = browserRequest.build({
        url: 'http://example/foo/param/second',
    });
    mock.getResponseForRequest(exampleRequest);

    expect(mock.getResponseForRequest(exampleRequest)).not.toBeNull();
});

test('.getResponseForRequest does not match GET request when path variables are set and not present in request', () => {
    const mock = createRestMock({ url: '/foo/:id' });
    const exampleRequest = browserRequest.build({
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
    const matchingRequest = browserRequest.build({
        url: '/example',
        body: {
            key: 'value',
        } as any,
    });
    const nonMatchingRequest = browserRequest.build({
        url: '/example',
        body: {
            key: 'another',
        } as any,
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
    const matchingRequest = browserRequest.build({
        url: '/example',
        body: {
            key2: 'value2',
            key1: 'value1',
        } as any,
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
    const matchingRequest = browserRequest.build({
        url: '/example',
        body: 'body_value' as any,
    });
    expect(mock.getResponseForRequest(matchingRequest)).toBeTruthy();
});

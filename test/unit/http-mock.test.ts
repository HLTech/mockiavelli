import { RestMock } from '../../src';

test('.getResponseForRequest matches GET request', () => {
    const mock = new RestMock(
        {
            url: '/foo',
            method: 'GET',
        },
        {
            status: 200,
            body: {},
        }
    );

    expect(
        mock.getResponseForRequest(
            {
                path: '/foo',
                method: 'GET',
                url: 'http://example/foo',
                type: 'xhr',
                headers: {},
                query: {},
            },
            'http://example'
        )
    ).not.toBeNull();
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

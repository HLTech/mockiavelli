import {
    requestToPlainObject,
    waitFor,
    addMockByPriority,
    createRequestFilter,
} from '../../src/utils';
import { createRestMock, Request } from './fixtures/request';

describe('requestToPlainObject', () => {
    test('returns serialized request object', () => {
        const req = Request.create({
            postData: JSON.stringify({ foo: 'bar' }),
            url: 'http://example.com:8000/some/path?foo=bar#baz',
            method: 'GET',
            headers: { header: 'header' },
            resourceType: 'xhr',
        });
        expect(requestToPlainObject(req)).toMatchObject({
            headers: {
                header: 'header',
            },
            hostname: 'http://example.com:8000',
            method: 'GET',
            path: '/some/path',
            query: {
                foo: 'bar',
            },
        });
    });

    test('returns only rawBody without body if postData() returns non-JSON string', () => {
        const req = Request.create({
            postData: 'somestring',
        });
        expect(requestToPlainObject(req)).toMatchObject({
            body: undefined,
            rawBody: 'somestring',
        });
    });

    test('returns correct path and url when origin contains trailing slash', () => {
        const req = Request.create({
            url: 'http://origin:8000/some/path',
        });
        expect(requestToPlainObject(req)).toMatchObject({
            url: 'http://origin:8000/some/path',
            path: '/some/path',
        });
    });
});

test('waitFor', async () => {
    const now = Date.now();
    await expect(waitFor(() => true)).resolves.toEqual(undefined);
    await expect(waitFor(() => Date.now() > now)).resolves.toEqual(undefined);
    await expect(waitFor(() => Date.now() > now + 50)).resolves.toEqual(
        undefined
    );
    await expect(waitFor(() => Date.now() > now - 50)).resolves.toEqual(
        undefined
    );
});

test('waitFor throws after 100ms by default', async () => {
    expect.assertions(1);
    const now = Date.now();
    try {
        await waitFor(() => Date.now() > now + 150);
    } catch (e) {
        expect(e).not.toBeFalsy();
    }
});

test('waitFor throws after provided timeout', async () => {
    expect.assertions(1);
    const now = Date.now();
    try {
        await waitFor(() => Date.now() > now + 55, 50);
    } catch (e) {
        expect(e).not.toBeFalsy();
    }
});

describe('addMockByPriority', () => {
    test('adds mocks with higher priority first', () => {
        const mocks = [createRestMock()];
        const higherPriorityMock = createRestMock({}, { priority: 10 });

        expect(addMockByPriority(mocks, higherPriorityMock)[0]).toBe(
            higherPriorityMock
        );
    });

    test('adds mock in correct order basing on priority', () => {
        const mocks = [createRestMock()];
        const higherPriorityMock = createRestMock({}, { priority: 10 });
        const middlePriorityMock = createRestMock({}, { priority: 5 });

        expect(addMockByPriority(mocks, higherPriorityMock)[0]).toBe(
            higherPriorityMock
        );
        expect(addMockByPriority(mocks, middlePriorityMock)[1]).toBe(
            middlePriorityMock
        );
    });

    test('adds mock to end when mock has lowest priority', () => {
        const mocks = [
            createRestMock({}, { priority: 10 }),
            createRestMock({}, { priority: 5 }),
        ];
        const lowestPriorityMock = createRestMock({}, { priority: 3 });

        expect(addMockByPriority(mocks, lowestPriorityMock)[2]).toBe(
            lowestPriorityMock
        );
    });

    test('adds mock before mock with same priority', () => {
        const mocks = [
            createRestMock({}, { priority: 10 }),
            createRestMock({}, { priority: 5 }),
        ];
        const samePriorityMock = createRestMock({}, { priority: 5 });

        expect(addMockByPriority(mocks, samePriorityMock)[1]).toBe(
            samePriorityMock
        );
    });
});

describe('createRequestMatcher', () => {
    test('return object when provided input as string', () => {
        expect(createRequestFilter('http://example.com')).toEqual({
            url: 'http://example.com',
        });
    });

    test('return object when provided input as object', () => {
        expect(
            createRequestFilter({
                url: 'http://example.com',
                method: 'POST',
            })
        ).toEqual({
            url: 'http://example.com',
            method: 'POST',
        });
    });

    test('return expected object when provided defaults', () => {
        expect(
            createRequestFilter('http://example.com', {
                method: 'POST',
            })
        ).toEqual({
            method: 'POST',
            url: 'http://example.com',
        });

        expect(
            createRequestFilter(
                {
                    url: 'http://foo.com',
                    query: { param: 'value' },
                },
                {
                    method: 'POST',
                }
            )
        ).toEqual({
            method: 'POST',
            url: 'http://foo.com',
            query: { param: 'value' },
        });
    });
});

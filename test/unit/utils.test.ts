import {
    waitFor,
    addMockByPriority,
    createRequestMatcher,
    printResponse,
    getOrigin,
} from '../../src/utils';
import { createRestMock } from './fixtures/request';

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
        expect(createRequestMatcher('http://example.com', 'POST')).toEqual({
            method: 'POST',
            url: 'http://example.com',
        });
    });

    test('return object when provided input as object', () => {
        expect(
            createRequestMatcher(
                {
                    url: 'http://example.com',
                },
                'POST'
            )
        ).toEqual({
            url: 'http://example.com',
            method: 'POST',
        });
    });
});

test('printResponse()', () => {
    expect(
        printResponse(
            200,
            {
                'content-type': 'text/html; charset=utf-8',
                date: 'Thu, 13 Feb 2020 17:03:57 GMT',
                'content-language': 'de-DE, en-CA',
            },
            Buffer.from(JSON.stringify({ foo: 'bar' }))
        )
    ).toMatchSnapshot();
});

test.each([
    ['http://example.com/endpoint', 'http://example.com'],
    ['https://example.com/endpoint', 'https://example.com'],
    ['http://example.com/', 'http://example.com'],
    ['http://example.com', 'http://example.com'],
    ['https://example.com:8080', 'https://example.com:8080'],
    ['http://user:pass@example.com', 'http://example.com'],
    ['', ''],
    [undefined, ''],
    ['not_ValiD_URL!', ''],
])('getOrigin(%s) returns %s', (url, expectedOrigin) => {
    expect(getOrigin(url as string)).toBe(expectedOrigin);
});

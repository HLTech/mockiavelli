import { requestToPlainObject, waitFor } from '../../src/utils';
import { createMockRequest } from './fixtures/request';

describe('utils', () => {
    describe('requestToPlainObject', () => {
        test('returns serialized request object', () => {
            const req = createMockRequest();
            req.postData.mockReturnValue(JSON.stringify({ foo: 'bar' }));
            req.url.mockReturnValue(
                'http://example.com:8000/some/path?foo=bar#baz'
            );
            req.method.mockReturnValue('GET');
            req.headers.mockReturnValue({ header: 'header' });
            req.resourceType.mockReturnValue('xhr');
            expect(requestToPlainObject(req)).toMatchSnapshot();
        });

        test('returns only rawBody without body if postData() returns non-JSON string', () => {
            const req = createMockRequest();
            req.postData.mockReturnValue('somestring');

            expect(requestToPlainObject(req)).toMatchObject({
                body: undefined,
                rawBody: 'somestring',
            });
        });

        test('returns correct path and url when origin contains trailing slash', () => {
            const req = createMockRequest();
            req.url.mockReturnValue('http://origin:8000/some/path');

            expect(requestToPlainObject(req)).toMatchObject({
                url: 'http://origin:8000/some/path',
                path: '/some/path',
            });
        });
    });

    test('waitFor', async () => {
        const now = Date.now();
        await expect(waitFor(() => true)).resolves.toEqual(undefined);
        await expect(waitFor(() => Date.now() > now)).resolves.toEqual(
            undefined
        );
        await expect(waitFor(() => Date.now() > now + 50)).resolves.toEqual(
            undefined
        );
        await expect(waitFor(() => Date.now() > now - 50)).resolves.toEqual(
            undefined
        );
    });
});

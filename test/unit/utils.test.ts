import {requestToPlainObject} from "../../src/utils";
import {createMockRequest} from "./fixtures/request";

describe('utils', () => {

    describe('requestToPlainObject', () => {

        test('returns serialized request object', () => {
            const req = createMockRequest();
            req.postData.mockReturnValue(JSON.stringify({foo: 'bar'}));
            req.url.mockReturnValue('http://origin:8000/some/path');
            req.method.mockReturnValue('GET');
            req.headers.mockReturnValue({header: 'header'});
            req.resourceType.mockReturnValue('xhr');

            expect(requestToPlainObject(req, 'http://origin:8000')).toEqual({
                url: 'http://origin:8000/some/path',
                path: '/some/path',
                method: 'GET',
                headers: {
                    header: 'header'
                },
                type: 'xhr',
                body: {foo: 'bar'},
                rawBody: JSON.stringify({foo: 'bar'})
            });
        });

        test('returns only rawBody without body if postData() returns non-JSON string', () => {
            const req = createMockRequest();
            req.postData.mockReturnValue('somestring');

            expect(requestToPlainObject(req, 'http://origin:8000')).toMatchObject({
                body: undefined,
                rawBody: "somestring"
            });
        });

        test('returns correct path and url when origin contains trailing slash', () => {
            const req = createMockRequest();
            req.url.mockReturnValue('http://origin:8000/some/path');

            expect(requestToPlainObject(req, 'http://origin:8000/')).toMatchObject({
                url: 'http://origin:8000/some/path',
                path: '/some/path'
            });

        });

    });
});
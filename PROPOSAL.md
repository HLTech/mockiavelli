## .getRequest() should throw error

`httpMock.getRequest()` should throws error when it is unable to return a matching request (currently it returns `undefined`)

```
const mock = mocketeer.addRestMock(...);
const request = await mock.getRequest();
// ^^ Throws Error if not able to return any requst
expect(request.body).toEqual(...);
```

## Match most recent mock first

Mocketeer should match most recently added mocks first:

```
mocketeer.addRestMock({method: 'GET', url: '/api/endpoint'}, {status: 200});
mocketeer.addRestMock({method: 'GET', url: '/api/endpoint'}, {status: 404});

// GET /api/endpoint -> 404
// GET /api/endpoint -> 404
```

```
mocketeer.addRestMock({method: 'GET', url: '/api/endpoint'}, {status: 200});
// GET /api/endpoint -> 200

mocketeer.addRestMock({method: 'GET', url: '/api/endpoint'}, {status: 404});
// GET /api/endpoint -> 404
```

Mocketeer should respect specificity of mocks :

```
mocketeer.addRestMock({method: 'GET', url: '/api/endpoint'}, {status: 201}); // less specific
mocketeer.addRestMock({method: 'GET', url: '/api/endpoint?param=value'}, {status: 200}); // more specific

// GET /api/endpoint?param=value -> 200
// GET /api/endpoint?param=value&anotherParam=value -> 200
// GET /api/endpoint -> 201
// GET /api/endpoint?param=another -> 201
```

Overwrite default order with `priority` and `once`

```
mocketeer.addRestMock({method: 'GET', url: '/api/endpoint'}, {status: 200}, {priority: 10, once: true});
mocketeer.addRestMock({method: 'GET', url: '/api/endpoint'}, {status: 404}, {priority: 5});
mocketeer.addRestMock({method: 'GET', url: '/api/endpoint'}, {status: 500});

// GET /api/endpoint -> 200
// GET /api/endpoint -> 404
// GET /api/endpoint -> 404
```

## Factory for creating Mocketeer instances

Proposal: add `Mocketeer.enableOnPage` method

```
const mocketeer = await Mocketeer.enableOnPage(page, opts)
```

It would replace current initialization logic:

```
const mocketeer = new Mocketeer(options);
await mocketeer.activate(page)
```

## Shorthand methods for each HTTP method

Proposal: add following shorthand methods:

```
mocketeer.mockGET('/api/endpoint', {... });
mocketeer.mockPOST('/api/endpoint', {... });
mocketeer.mockPUT('/api/endpoint', {... });
mocketeer.mockDELETE('/api/endpoint', {... });
```

Those methods acccept string or an objct:

```
mocketeer.mockGET({
    url: '/api/endpoint',
    query: {
      param: 'value'
    }
}, { ... });
```

for consistency we existing `addRestMock` should be renamed to `mockHTTP`

```
mocketeer.mockHTTP({
    method: 'GET',
    url: 'api/endpoint'
}, { ... });
```

## Support for URL params (path variables)

```
const updateUserMock = mocketeer.mockPUT('/api/users/:id', {... });

// App makes PUT /api/users/10 request ...

const request = await updateUserMock.getRequest();
expect(request.params.id).toEqual('10');

```

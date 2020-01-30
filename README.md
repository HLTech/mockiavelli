# Mocketeer

Mocketeer is HTTP request mocking library for [Puppeteer](http://pptr.dev/). It was created to enable effective testing of Single Page Apps in isolation and independently from API services.

## Main features

-   mock network requests directly in the test case
-   inspect and assert requests payload
-   match request by method, url, path parameters and query strings
-   support for cross-origin requests
-   works with every testing framework running in node.js
-   fully typed in Typescript and well tested
-   lightweight - only 4 total dependencies (direct and indirect)

## Docs

-   [Installation](#installation)
-   [Getting started](#getting-started)
-   [Full example](#full-example)
-   [Usage guide](#guide)
    -   [Mocking requests](#mocking-requests)
    -   [Request assertion](#request-assertion)
    -   [Path parameters matching](#path-parameters-matching)
    -   [Query params matching](#query-parameters-matching)
    -   [One-time mocks](#one-time-mocks)
    -   [Matching order](#matching-order)
    -   [Matching priority](#matching-priority)
    -   [Cross-origin (cross-domain) API requests](#cors)
    -   [Dynamic responses](#dynamic-responses)
    -   [Debug mode](#debug-mode)
-   [API](#api)
    -   [`Mocketeer`](#Mocketeer)
    -   [`Mock`](#Mock)

## Installation <a name="installation"/>

```
yarn add @hltech/mocketeer
```

-   Mocketeer requires [Puppeteer](https://pptr.dev/) which need to be installed separately
-   If you're using [jest](jestjs.io/) we also recommend to install [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer)

## Getting started <a name="getting-started"/>

To start using Mocketeer, you need to instantiate `Mocketeer` class by providing it an instance of [Puppeteer Page](https://pptr.dev/#?product=Puppeteer&show=api-class-page).

```typescript
const { Mocketeer } = require('@hltech/mocketeer');

const mocketeer = await Mocketeer.setup(page);
```

Mocketeer now intercepts all HTTP requests issues from this page.

To define response for a given request, call `mocketeer.mock<HTTP_METHOD>` with request URL and response object:

```typescript
const getUsersMock = mocketeer.mockPOST('/api/users', {
    status: 201,
    body: { id: 123 },
});
```

Now every `POST /api/users` request issued from this page will receive `201 Created` response with provided body.

You can also inspect the details of the request once it has been made:

```
const request = await getUsersMock.getRequest();
console.log(request);
// > {url: 'http://example.com/api/users', body: { name: 'John', ...}, headers: {...}}
```

## Full example <a name="full-example"/>

The example below is a [Jest](https://jestjs.io/en/) test case verifies a sign-up form in a locally running application.

Mocketeer is used to mock and assert request that the app makes to REST API upon form submission.

```js
const puppeteer = require('puppeteer');
const { Mocketeer } = require('@hltech/mocketeer');

test('Sign-up form', async () => {
    // Launch puppeteer and navigate to application
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8000/');

    // Enable Mocketeer on an instance of puppeteer Page
    const mocketeer = await Mocketeer.setup(page);

    // Configure mocked response
    const postUserMock = mocketeer.mockPOST('/api/user', {
        status: 201,
        body: {
            userId: '123',
        },
    });

    // Perform interaction
    await page.type('input.name', 'John Doe');
    await page.type('input.email', 'email@example.com');
    await page.click('button.submit');

    // Verify request payload
    const postUserRequest = await postUserMock.getRequest();
    expect(postUserRequest.body).toEqual({
        user_name: 'John Doe',
        user_email: 'email@example.com',
    });

    // Verify message shown on the screen
    const msg = page.evaluate(
        () => document.querySelector('.message').textContent
    );
    expect(msg).toEqual('Created account 123');
});
```

## Usage guide <a name="guide"/>

### Mocking requests <a name="mocking-requests"/>

To mock any HTTP request matching given URL and method use `mocketeer.mock<HTTP_METHOD>(url, response)`:

```
mocketeer.mockGET('/api/users', {status: 200, body: [....]})
mocketeer.mockPOST('/api/users', {status: 201, body: {...})
mocketeer.mockPUT('/api/users/123', {status: 200, body: {...}})
mocketeer.mockDELETE('/api/users/123', {status: 202})

// GET /endpoint => 200
// POST /endpoint => 201
// PUT /endpoint => 200
// DELETE /endpoint => 202
```

Alternatively, you can also pass an object to `mocketeer.mock` method.

```
mocketeer.mock({
  method: 'GET',
  url: '/api/users'
}, {
  status: 200,
  body: [...]
});
```

Those 2 ways of defining mocks are completely equivalent.

### Request assertion <a name="request-assertion"/>

`mocketeer.mock<HTTP_METHOD>` returns an instance of `Mock` class that records all requests the matched given mock.

To assert details of request made by application use async `mock.getRequest()` method. It will throw an error if no matching request was made.

```
const postUsersMock = mocketeer.mockPOST('/api/users', {status: 200});

// ... perform interaction on tested page ...

const postUserRequest = await postUsersMock.getRequest(); // Throws if POST /api/users request was not made
expect(postUserRequest.body).toBe({
  name: 'John',
  email: 'john@example.com'
});
```

### Path parameters matching <a name="path-parameters-matching"/>

Path parameters in the URL can be matched using `:param` notation. When a request is made, the actual params are exposed in `request.params`:

```js
const getUserMock = mocketeer.mockGET('/api/users/:userId', { status: 200 });

// GET /api/users/1234 => 200
// GET /api/users => 404
// GET /api/users/1234/categories => 404

console.log(await getUserMock.getRequest());
// { params: {userId : "12345"}, path: "/api/users/12345", ... }
```

### Query params matching <a name="query-parameters-matching"/>

Mocketeer supports matching requests by query parameters. All defined params are then required to match the request, but excess params are ignored:

```
mocketeer.mockGET('/api/users?status=active&sort=asc', {status: 200})

// GET /api/users?status=active&sort=asc            => 200
// GET /api/users?status=active&sort=asc&limit=10   => 200
// GET /api/users?status=active                     => 404
```

It is also possible to define query parameters as object. This notation works great for matching array query params:

```
mocketeer.mockGET({url: '/api/users', query: { status: ['active', 'blocked']}}, {status: 200})

// GET /api/users?status=active&status=blocked  => 200
```

### One-time mocks <a name="one-time-mocks"/>

By default mock are persistent, meaning that they will respond to multiple matching requests:

```
mocketeer.mockGET('/api/users', {status: 200});

// GET /api/users => 200
// GET /api/users => 200
```

To change this behaviour and disable mock once it matched a request use `once` option:

```
mocketeer.mockGET('/api/users', {status: 200}, {once: true});

// GET /api/users => 200
// GET /api/users => 404
```

### Matching order <a name="matching-order"/>

Mocks are matched in the "newest first" order. To override previously defined mock simply define new one:

```
mocketeer.mockGET('/api/users', {status: 200});
mocketeer.mockGET('/api/users', {status: 401});

// GET /api/users => 401

mocketeer.mockGET('/api/users', {status: 500})

// GET /api/users => 500
```

### Matching priority <a name="matching-priority"/>

To change the default "newest first" matching order, you define mocks with combination of `once` and `priority` parameters:

```
mocketeer.mockGET('/api/users', {status: 404}, {once: true, priority: 10});
mocketeer.mockGET('/api/users', {status: 500}, {once: true, priority: 5});
mocketeer.mockGET('/api/users', {status: 200});

// GET /api/users => 404
// GET /api/users => 500
// GET /api/users => 200
```

### Cross-origin (cross-domain) API requests <a name="cors"/>

Mocketeer has built-in support for cross-origin requests. If application and API are not on the same origin (domain) just provide the full request URL to `mocketeer.mock<HTTP_METHOD>`

```typescript
mocketeer.mockGET('http://api.example.com/api/users', { status: 200 });

// GET http://api.example.com/api/users => 200
// GET http://app.example.com/api/users => 404
```

### Dynamic responses <a name="dynamic-responses"/>

It is possible to define mocked response in function of incoming request. This is useful if you need to use some information from request URL or body in the response:

```typescript
mocketeer.mockGET('/api/users/:userId', (request) => {
    return {
        status: 200,
        body: {
            id: request.params.userId,
            name: 'John',
            email: 'john@example.com',
            ...
        },
    };
});

// GET /api/users/123 => 200 {"id": "123", ... }
```

### Debug mode <a name="debug-mode"/>

Passing `{debug: true}` to `Mocketeer.setup` enables rich debugging in console:

```
await Mocketeer.setup(page, {debug: true});
```

## API <a name="api"/>

### `class Mocketeer` <a name="Mocketeer"/>

#### `Mocketeer.setup(page, options): Promise<Mocketeer>`

Factory method used to set-up request mocking on provided Puppeteer Page. It creates and returns an instance of Mocketeer

Once created, mocketeer will intercept all requests made by the page and match them with defined mocks.

If request does not match any mocks, it will be responded with `404 Not Found`.

###### Arguments

-   `page` _(Page)_ instance of Puppeteer [Page](https://pptr.dev/#?product=Puppeteer&show=api-class-page)
-   `options` _(object)_ configuration options
    -   `debug: boolean` turns debug mode with logging to console (default: `false`)

###### Example

```typescript
const browser = await puppeteer.launch();
const page = await browser.newPage();
const mocketeer = await Mocketeer.setup(page);
```

###### Returns

Promise resolved with instance of `Mocketeer` once request mocking is established.

#### `mocketeer.mock<HTTP_METHOD?>(matcher, response, options?)`

Respond all requests of `HTTP_METHOD` method matching `matcher` with provided `response`.

###### Arguments

-   `matcher` _(string | object)_ matches request with mock. Can be URL string or an object with following properties:
    -   `url: string` - can be provided as path (`/api/endpoint`) or full URL (`http://example.com/endpoint`) for CORS requests. Supports path parameters (`/api/users/:user_id`)
    -   `query?: object` object literal which accepts strings and arrays of strings as values, transformed to queryString
    -   `method: string` -
-   `response` _(object | function)_ content of mocked response. Can be a object or a function returning object with following properties:
    -   `status: number`
    -   `headers?: object`
    -   `body?: any`
-   `options?` _(object)_ optional config object
    -   `prority` _(number)_ when intercepted request matches multiple mock, mocketeer will use the one with highest priority
    -   `once` _(boolean)_ _(default: false)_ when set to true intercepted request will be matched only once

###### Returns

Instance of `Mock`.

###### Examples

```typescript
// Basic example
mocketeer.mockGET('/api/clients', {
    status: 200,
    body: [{...}],
});
```

```typescript
// Match by query parameters passed in URL
mocketeer.mockGET('/api/clients?city=Bristol&limit=10', {
    status: 200,
    body: [{...}],
});
```

```typescript
// Match by query parameters passed in query object
mocketeer.mockGET(
    {
        url: '/api/clients',
        query: {
            city: 'Bristol',
            limit: 10,
        },
    },
    {
        status: 200,
        body: [{...}],
    }
);
```

```typescript
// Match by path params
mocketeer.mockPUT('/api/clients/:clientId', {
    status: 200,
    body: [{...}],
});
```

```typescript
// CORS requests
mocketeer.mockGET('http://example.com/api/clients/', {
    status: 200,
    body: [{...}],
});
```

---

### `class Mock` <a name="Mock"/>

#### `getRequest(index?: number): Promise<MatchedRequest>`

Retrieve n-th request matched by the mock. The method is async - it will wait 100ms for requests to be intercepted to avoid race condition issue. Throws if mock was not matched by any request.

###### Arguments

-   `index` _(number)_ index of request to return. Default: 0.

###### Returns

Promise resolved with `MatchedRequest` - object representing request that matched the mock:

-   `method: string` - request's method (GET, POST, etc.)
-   `url: string` - request's full URL. Example: `http://example.com/api/clients?name=foo`
-   `hostname: string` - request protocol and host. Example: `http://example.com`
-   `headers: object` - object with HTTP headers associated with the request. All header names are lower-case.
-   `path: string` - request's url path, without query string. Example: `'/api/clients'`
-   `query: object` - request's query object, as returned from [`querystring.parse`](https://nodejs.org/docs/latest/api/querystring.html#querystring_querystring_parse_str_sep_eq_options). Example: `{name: 'foo'}`
-   `body: any` - JSON deserialized request's post body, if any
-   `rawBody: string` undefined)\_ - raw request's post body, if any
-   `type: string` - request's resource type. Possible values are `xhr` and `fetch`
-   `params: object` - object with path parameters specified in `url`

###### Example

```typescript
const patchClientMock = mocketeer.mockPATCH('/api/client/:clientId', { status: 200 });

// .. send request from page ...

const patchClientRequest = await patchClientMock.getRequest();

expect(patchClientRequest).toEqual({
    method: 'PATCH',
    url: 'http://example.com/api/client/1020',
    hostname: 'http://example.com',
    headers: {...},
    path: '/api/client/1020',
    query: {},
    body: {name: 'John', email: 'john@example.com'}
    rawBody: '{\"name\":\"John\",\"email\":\"john@example.com\"}',
    type: 'fetch',
    params: { clientId: '' }
})
```

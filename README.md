<p align="center">
    <img src="./mockiavelli-logo.png" alt="Mockiavelli">
</p>
<h2 align="center">
    Request mocking for Puppeteer and Playwright
</h2>

[![npm](https://img.shields.io/npm/v/mockiavelli)](https://www.npmjs.com/package/mockiavelli) [![Node.js CI](https://github.com/HLTech/mockiavelli/actions/workflows/node.js.yml/badge.svg)](https://github.com/HLTech/mockiavelli/actions/workflows/node.js.yml)

Mockiavelli is HTTP request mocking library for [Puppeteer](http://pptr.dev/) and [Playwright](https://playwright.dev/). It was created to enable effective testing of Single Page Apps in isolation and independently from API services.

Main features

-   simple, minimal API
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
    -   [URL and method matching](#url-and-method-matching)
    -   [Path parameters matching](#path-parameters-matching)
    -   [Query params matching](#query-parameters-matching)
    -   [Request assertion](#request-assertion)
    -   [One-time mocks](#one-time-mocks)
    -   [Matching order](#matching-order)
    -   [Matching priority](#matching-priority)
    -   [Specifying API base url](#base-url)
    -   [Cross-origin (cross-domain) API requests](#cors)
    -   [Stop mocking](#stop-mocking)
    -   [Dynamic responses](#dynamic-responses)
    -   [Not matched requests](#not-matched-requests)
    -   [Debug mode](#debug-mode)
-   [API](#api)

    -   [`Mockiavelli`](#Mockiavelli)
    -   [`Mock`](#Mock)

## Installation <a name="installation"/>

```bash
npm install mockiavelli -D
```

or if you are using yarn:

```bash
yarn add mockiavelli -D
```

-   Mockiavelli requires one of the following to be installed separately:
    -   [Puppeteer](https://pptr.dev/) (in versions 2.x - 8.x)
    -   [Playwright](https://playwright.dev/) (in version 1.x)
-   If you're using [jest](jestjs.io/) we also recommend to install [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer) or [jest-playwright](https://www.npmjs.com/package/jest-playwright-preset)

## Getting started <a name="getting-started"/>

To start using Mockiavelli, you need to instantiate it by providing it a `page` - instance of [Puppeteer Page](https://pptr.dev/#?product=Puppeteer&show=api-class-page) or [Playwright Page](https://playwright.dev/docs/api/class-page)

```typescript
import { Mockiavelli } from 'mockiavelli';
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();
const mockiavelli = await Mockiavelli.setup(page);
```

Mockiavelli will start to intercept all HTTP requests issued from this page.

To define response for a given request, call `mockiavelli.mock<HTTP_METHOD>` with request URL and response object:

```typescript
const getUsersMock = mockiavelli.mockGET('/api/users', {
    status: 200,
    body: [
        { id: 123, name: 'John Doe' },
        { id: 456, name: 'Mary Jane' },
    ],
});
```

Now every `GET /api/users` request issued from this page will receive `200 OK` response with provided body.

```typescript
const users = await page.evaluate(() => {
    return fetch('/api/users').then((res) => res.json());
});
console.log(users); // [{id: 123, name: 'John Doe' }, {id: 456, name: 'Mary Jane'}]
```

## Full example <a name="full-example"/>

The example below is a [Jest](https://jestjs.io/en) test case (with [jest-puppeteer preset](https://github.com/smooth-code/jest-puppeteer)) verifies a sign-up form in a locally running application.

Mockiavelli is used to mock and assert request that the app makes to REST API upon form submission.

```typescript
import { Mockiavelli } from 'mockiavelli';

test('Sign-up form', async () => {
    // Enable mocking on instance of puppeteer Page (provided by jest-puppeteer)
    const mockiavelli = await Mockiavelli.setup(page);

    // Navigate to application
    await page.goto('http://localhost:8000/');

    // Configure mocked response
    const postUserMock = mockiavelli.mockPOST('/api/user', {
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
    const postUserRequest = await postUserMock.waitForRequest();
    expect(postUserRequest.body).toEqual({
        user_name: 'John Doe',
        user_email: 'email@example.com',
    });

    // Verify message shown on the screen
    await expect(page).toMatch('Created account ID: 123');
});
```

## Usage guide <a name="guide"/>

### URL and method matching <a name="url-and-method-matching"/>

Request can most easily be mocked by calling `mockiavelli.mock<HTTP_METHOD>` with endpoint URL:

```typescript
mockiavelli.mockGET('/api/users', { status: 200, body: [] });
// GET /api/users => 200

mockiavelli.mockPOST('/api/users', { status: 201 });
// POST /api/users => 200
```

Alternatively you can provide HTTP method and URL as object to `mockiavelli.mock`:

```typescript
mockiavelli.mock(
    { method: 'GET', url: '/api/users' },
    { status: 200, body: [] }
);
// GET /api/users => 200
```

If HTTP method is not specified, any request that matches provided URL will be mocked.

```typescript
mockiavelli.mock('/api/users', { status: 500 });
// GET /api/users => 500
// POST /api/users => 500
```

### Path parameters matching <a name="path-parameters-matching"/>

Path parameters in the URL can be matched using `:param` notation, thanks to [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) library.

If mock matches the request, those params are exposed in `request.params` property.

```typescript
const getUserMock = mockiavelli.mockGET('/api/users/:userId', { status: 200 });

// GET /api/users/1234 => 200
// GET /api/users => 404
// GET /api/users/1234/categories => 404

console.log(await getUserMock.waitForRequest());
// { params: {userId : "12345"}, path: "/api/users/12345", ... }
```

### Query params matching <a name="query-parameters-matching"/>

Mockiavelli supports matching requests by query parameters. All defined params are then required to match the request, but excess params are ignored:

```typescript
mockiavelli.mockGET('/api/users?city=Warsaw&sort=asc', { status: 200 });

// GET /api/users?city=Warsaw&sort=asc            => 200
// GET /api/users?city=Warsaw&sort=asc&limit=10   => 200
// GET /api/users?city=Warsaw                     => 404
```

It is also possible to define query parameters as object. This notation works great for matching array query params:

```typescript
mockiavelli.mockGET(
    { url: '/api/users', query: { status: ['active', 'blocked'] } },
    { status: 200 }
);

// GET /api/users?status=active&status=blocked  => 200
```

### Request assertion <a name="request-assertion"/>

`mockiavelli.mock<HTTP_METHOD>` and `mockiavelli.mock` methods return an instance of `Mock` class that records all requests the matched given mock.

To assert details of request made by application use async `mock.waitForRequest()` method. It will throw an error if no matching request was made.

```typescript
const postUsersMock = mockiavelli.mockPOST('/api/users', { status: 200 });

// ... perform interaction on tested page ...

const postUserRequest = await postUsersMock.waitForRequest(); // Throws if POST /api/users request was not made
expect(postUserRequest.body).toBe({
    name: 'John',
    email: 'john@example.com',
});
```

### One-time mocks <a name="one-time-mocks"/>

By default mock are persistent, meaning that they will respond to multiple matching requests:

```typescript
mockiavelli.mockGET('/api/users', { status: 200 });

// GET /api/users => 200
// GET /api/users => 200
```

To change this behaviour and disable mock once it matched a request use `once` option:

```typescript
mockiavelli.mockGET('/api/users', { status: 200 }, { once: true });

// GET /api/users => 200
// GET /api/users => 404
```

### Matching order <a name="matching-order"/>

Mocks are matched in the "newest first" order. To override previously defined mock simply define new one:

```typescript
mockiavelli.mockGET('/api/users', { status: 200 });
mockiavelli.mockGET('/api/users', { status: 401 });

// GET /api/users => 401

mockiavelli.mockGET('/api/users', { status: 500 });

// GET /api/users => 500
```

### Matching priority <a name="matching-priority"/>

To change the default "newest first" matching order, you define mocks with combination of `once` and `priority` parameters:

```typescript
mockiavelli.mockGET(
    '/api/users',
    { status: 404 },
    { once: true, priority: 10 }
);
mockiavelli.mockGET('/api/users', { status: 500 }, { once: true, priority: 5 });
mockiavelli.mockGET('/api/users', { status: 200 });

// GET /api/users => 404
// GET /api/users => 500
// GET /api/users => 200
```

### Specifying API base url <a name="base-url"/>

It is possible to initialize Mockiavelli instance with specified API base url.
This API base url is added to every mocked request url.

```typescript
const mockiavelli = await Mockiavelli.setup(page, { baseUrl: '/api/v1' });

mockiavelli.mockGET('/users', { status: 200 });

// GET /api/v1/users => 200
```

### Cross-origin (cross-domain) API requests <a name="cors"/>

Mockiavelli has built-in support for cross-origin requests. If application and API are not on the same origin (domain) just provide the full request URL to `mockiavelli.mock<HTTP_METHOD>`

```typescript
mockiavelli.mockGET('http://api.example.com/api/users', { status: 200 });

// GET http://api.example.com/api/users => 200
// GET http://another-domain.example.com/api/users => 404
```

### Stop mocking <a name="stop-mocking">

To stop intercept requests you can call `mockiavelli.disable` method (all requests will send to real services).
Then you can enable mocking again by `mockiavelli.enable` method.

```typescript
mockiavelli.mockGET('/api/users/:userId', {
    status: 200,
    body: { name: 'John Doe' },
});

// GET /api/users/1234 => 200 { name: 'John Doe' }

mockiavelli.disable();

// GET /api/users/1234 => 200 { name: 'Jacob Kowalski' } <- real data from backend

mockiavelli.enable();

// GET /api/users/1234 => 200 { name: 'John Doe' }
```

### Dynamic responses <a name="dynamic-responses"/>

It is possible to define mocked response in function of incoming request. This is useful if you need to use some information from request URL or body in the response:

```typescript
mockiavelli.mockGET('/api/users/:userId', (request) => {
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

### Not matched requests <a name="not-matched-requests" />

In usual scenarios, you should mock all requests done by your app.

Any XHR or fetched request done by the page not matched by any mock will be responded with `404 Not Found`. Mockiavelli will also log this event to console:

```typescript
Mock not found for request: type=fetch method=GET url=http://example.com
```

### Debug mode <a name="debug-mode"/>

Passing `{debug: true}` to `Mockiavelli.setup` enables rich debugging in console:

```typescript
await Mockiavelli.setup(page, { debug: true });
```

## API <a name="api"/>

### `class Mockiavelli` <a name="Mockiavelli"/>

#### `Mockiavelli.setup(page, options): Promise<Mockiavelli>`

Factory method used to set-up request mocking on provided Puppeteer or Playwright Page. It creates and returns an instance of [Mockiavelli](#Mockiavelli)

Once created, mockiavelli will intercept all requests made by the page and match them with defined mocks.

If request does not match any mocks, it will be responded with `404 Not Found`.

###### Arguments

-   `page` _(Page)_ instance of [Puppeteer Page](https://pptr.dev/#?product=Puppeteer&show=api-class-page) or [Playwright Page](https://playwright.dev/docs/api/class-page)
-   `options` _(object)_ configuration options
    -   `baseUrl: string` specify the API base url, which will be added to every mocked request url
    -   `debug: boolean` turns debug mode with logging to console (default: `false`)

###### Example

```typescript
import { puppeteer } from 'puppeteer';
import { Mockiavelli } from 'mockiavelli';

const browser = await puppeteer.launch();
const page = await browser.newPage();
const mockiavelli = await Mockiavelli.setup(page);
```

###### Returns

Promise resolved with instance of `Mockiavelli` once request mocking is established.

#### `mockiavelli.mock(matcher, response, options?)`

Respond all requests of matching `matcher` with provided `response`.

###### Arguments

-   `matcher` _(string | object)_ URL string or object with following properties:
    -   `url: string` - can be provided as path (`/api/endpoint`) or full URL (`http://example.com/endpoint`) for CORS requests. Supports path parameters (`/api/users/:user_id`)
    -   `method?: string` - any valid HTTP method. If not provided, will match any HTTP method.
    -   `query?: object` object literal which accepts strings and arrays of strings as values, transformed to queryString
-   `response` _(object | function)_ content of mocked response. Can be a object or a function returning object with following properties:
    -   `status: number`
    -   `headers?: object`
    -   `body?: any`
-   `options?` _(object)_ optional config object
    -   `prority` _(number)_ when intercepted request matches multiple mock, mockiavelli will use the one with highest priority
    -   `once` _(boolean)_ _(default: false)_ when set to true intercepted request will be matched only once

###### Returns

Instance of [`Mock`](#Mock).

###### Example

```typescript
mockiavelli.mock(
    {
        method: 'GET',
        url: '/api/clients',
        query: {
            city: 'Bristol',
            limit: 10,
        },
    },
    {
        status: 200,
        headers: {...},
        body: [{...}],
    }
);
```

#### `mockiavelli.mock<HTTP_METHOD>(matcher, response, options?)`

Shorthand method for `mockiavelli.mock`. Matches all request with `HTTP_METHOD` method. In addition to matcher object, it also accepts URL string as first argument.

-   `matcher: (string | object)` URL string or object with following properties:
    -   `url: string` - can be provided as path (`/api/endpoint`) or full URL (`http://example.com/endpoint`) for CORS requests. Supports path parameters (`/api/users/:user_id`)
    -   `query?: object` object literal which accepts strings and arrays of strings as values, transformed to queryString
-   `response: (object | function)` content of mocked response. Can be a object or a function returning object with following properties:
    -   `status: number`
    -   `headers?: object`
    -   `body?: any`
-   `options?: object` optional config object
    -   `prority?: number` when intercepted request matches multiple mock, mockiavelli will use the one with highest priority. Default: `0`
    -   `once: boolean` when set to true intercepted request will be matched only once. Default: `false`

Available methods are:

-   `mockiavelli.mockGET`
-   `mockiavelli.mockPOST`
-   `mockiavelli.mockDELETE`
-   `mockiavelli.mockPUT`
-   `mockiavelli.mockPATCH`

###### Examples

```typescript
// Basic example
mockiavelli.mockPOST('/api/clients', {
    status: 201,
    body: {...},
});
```

```typescript
// Match by query parameters passed in URL
mockiavelli.mockGET('/api/clients?city=Bristol&limit=10', {
    status: 200,
    body: [{...}],
});
```

```typescript
// Match by path params
mockiavelli.mockGET('/api/clients/:clientId', {
    status: 200,
    body: [{...}],
});
```

```typescript
// CORS requests
mockiavelli.mockGET('http://example.com/api/clients/', {
    status: 200,
    body: [{...}],
});
```

#### `mockiavelli.disable()`

Stop mocking of requests by Mockiavelli.
After that all requests pass to real endpoints.
This method does not reset set mocks or possibility to set mocks, so when we then enable again mocking by `mockiavelli.enable()`, all set mocks works again.

#### `mockiavelli.enable()`

To enable mocking of requests by Mockiavelli when previously `mockiavelli.diable()` was called.

---

### `class Mock` <a name="Mock"/>

#### `waitForRequest(index?: number): Promise<MatchedRequest>`

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
-   `type: string` - request's resource type. Possible values are `xhr` and `fetch`
-   `params: object` - object with path parameters specified in `url`

###### Example

```typescript
const patchClientMock = mockiavelli.mockPATCH('/api/client/:clientId', { status: 200 });

// .. send request from page ...

const patchClientRequest = await patchClientMock.waitForRequest();

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

#### `waitForRequestCount(n: number): Promise<void>`

Waits until mock is matched my `n` requests. Throws error when timeout (equal to 100ms) is exceeded.

# Mocketeer

Easy API requests mocking using Puppeteer - for UI testing and more.

## Install

```
yarn add @hltech/mocketeer
```

## Examples

**with jest-puppeteer**

```typescript
import { Mocketeer } from '@hltech/mocketeer';

test('can create client', async () => {
    await page.goto('https://example.com');

    // Create Mocketeer instance
    const mocketeer = Mocketeer.setup(page);

    // Set up a mock
    const mock = await mocketeer.mockPost('/api/user', {
        status: 201,
        body: {
            userId: '123',
        },
    });

    // Do something on the page
    await page.type('.email', 'email@example.com');
    await page.click('.submit-button');

    // Wait for mock to be called and verify request content
    const request = await mock.getRequest();
    expect(request.body).toEqual({
        user_email: 'email@example.com',
    });
});
```

**with puppeteer**

```typescript
import puppeteer from 'puppeteer';
import { Mocketeer } from '@hltech/mocketeer';

(async () => {
    // Setup puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://example.com');

    // Create Mocketeer instance
    const mocketeer = Mocketeer.setup(page);

    // Set up a mock
    const mock = await mocketeer.mockPost('/api/user', {
        status: 201,
        body: {
            userId: '123',
        },
    });

    // Do something on the page
    await page.type('.email', 'email@example.com');
    await page.click('.submit-button');

    // Wait for mock to be called and verify request content
    const request = await mock.getRequest();
    expect(request.body).toEqual({
        user_email: 'email@example.com',
    });
})();
```

## API

### Mocketeer

#### Mocketeer.setup(page, options): Promise< Mocketeer >

Factory method used to set-up request mocking on provided Puppeteer Page. It creates and returns an instance of Mocketeer

Mocketeer will intercept all requests made by the page and match them to mocks set up with `mocketeer.mock`.
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

###### Arguments

-   `page` _(Page)_ instance of Puppeteer [Page](https://pptr.dev/#?product=Puppeteer&show=api-class-page)

###### Returns

Promise which is resolved when request mocking is established

###### Example

```typescript
const browser = await puppeteer.launch();
const page = await browser.newPage();
await mocketeer.activate(page);
```

#### .mock(filter: RequestFilter, response: MockedResponse, options?): RestMock

Respond to xhr and fetch requests that match the `filter` with provided `response`.
Request are matched based on adding order - most recently added first.
Pass query params through `query` argument in `filter` object or simply append text to `url`.
`url` can contain path parameters for example `/api/client/:id` which you can then access through params object.

###### Arguments

-   `filter` _(RequestFilter)_ used to determine if request matches the mock
    -   `method: string`
    -   `url: string`
    -   `query(optional): QueryObject` object literal which accepts strings and arrays of strings as values, transformed to queryString
-   `response` _(MockedResponse)_ content of mocked response
    -   `status: number`
    -   `headers: object`
    -   `body: any`
-   `options` _(object)_ optional config object
    -   `prority` _(number)_ when intercepted request matches multiple mock, mocketeer will use the one with highest priority
    -   `once` _(boolean)_ _(default: false)_ when set to true intercepted request will be matched only once

###### Returns

Newly created instance of `RestMock`.

###### Example

```typescript
mocketeer.mock(
    {
        method: 'POST',
        url: '/api/clients',
    },
    {
        status: 201,
        body: {
            clientId: 12345,
        },
    }
);
```

###### Example with query passed as an argument

```typescript
mocketeer.mock(
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
        body: {
            clientId: 12345,
        },
    }
);
```

###### Example with queryString appended to the url

```typescript
mocketeer.mock(
    {
        method: 'GET',
        url: '/api/clients?city=Bristol&limit=10',
    },
    {
        status: 200,
        body: {
            clientId: 12345,
        },
    }
);
```

#### .mockGET(filter: RequestMethodFilter | string, response: MockedResponse, options?): RestMock

#### .mockPOST(filter: RequestMethodFilter | string, response: MockedResponse, options?): RestMock

#### .mockPUT(filter: RequestMethodFilter | string, response: MockedResponse, options?): RestMock

#### .mockDELETE(filter: RequestMethodFilter | string, response: MockedResponse, options?): RestMock

Respond to xhr and fetch requests with adequate rest method that match the `filter` with provided `response`.
Request are matched based on adding order - most recently added first.
Pass `filter` as an object or as an `url` string.
Pass query params through `query` argument in `filter` object or simply append text to `url`

###### Arguments

-   `filter` _(RequestMethodFilter)_ used to determine if request matches the mock
    -   `url: string`
    -   `query(optional): QueryObject` object literal which accepts strings and arrays of strings as values, transformed to queryString
-   `filter` _(string)_ `url` used to determine if request matches the mock
-   `response` _(MockedResponse)_ content of mocked response
    -   `status: number`
    -   `headers: object`
    -   `body: any`
-   `options` _(object)_ optional config object
    -   `prority` _(number)_ when intercepted request matches multiple mock, mocketeer will use the one with highest priority
    -   `once` _(boolean)_ _(default: false)_ when set to true intercepted request will be matched only once

###### Returns

Newly created instance of `RestMock`.

###### Example of GET request

```typescript
mocketeer.mockGET(
    {
        url: '/api/clients',
    },
    {
        status: 201,
        body: {
            clientId: 12345,
        },
    }
);
```

###### Example of GET request with query passed as an argument

```typescript
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
        body: {
            clientId: 12345,
        },
    }
);
```

###### Example of GET request with queryString appended to the url

```typescript
mocketeer.mockGET(
    {
        url: '/api/clients?city=Bristol&limit=10',
    },
    {
        status: 200,
        body: {
            clientId: 12345,
        },
    }
);
```

###### Example of GET request with filter as a string with query

```typescript
mocketeer.mockGET('/api/clients?city=Bristol&limit=10', {
    status: 200,
    body: {
        clientId: 12345,
    },
});
```

###### Example of GET request with id as path parameter

```typescript
mocketeer.mockGET(
    {
        url: '/api/client/:id',
    },
    {
        status: 200,
        body: {
            clientId: 12345,
        },
    }
);
```

---

### RestMock

#### getRequest(index?: number): Promise\<MatchedRequest | undefined\>

Retrieve n-th request matched by the mock. The method is async because it will wait 100ms for requests to be intercepted to avoid race condition issue. Resolves with undefined if mock was not matched by any request.

###### Arguments

-   `index` _(number)_ index of request to return. Default: 0.

###### Returns

Promise resolved with `MatchedRequest` - object representing request that matched the mock:

-   method _(string)_ - request's method (GET, POST, etc.)
-   url _(string)_ - request's full URL. Example: `http://example.com/api/clients?name=foo`
-   hostname _(string)_ - request protocol and host. Example: `http://example.com`
-   headers _(object)_ - object with HTTP headers associated with the request. All header names are lower-case.
-   path _(string)_ - request's url path, without query string. Example: `'/api/clients'`
-   query _(QueryObject)_ - request's query object, as returned from [`querystring.parse`](https://nodejs.org/docs/latest/api/querystring.html#querystring_querystring_parse_str_sep_eq_options). Example: `{name: 'foo'}`
-   body _(any)_ - JSON deserialized request's post body, if any
-   rawBody _(string | undefined)_ - raw request's post body, if any
-   type _(string)_ - request's resource type. Possible values are `xhr` and `fetch`
-   params _(object)_ - object with path parameters specified in `url`

###### Example

```typescript
const createClientMock = mocketeer.mockREST(
    {
        method: 'POST',
        url: '/api/clients',
    },
    {
        status: 201,
        body: {
            clientId: 12345,
        },
    }
);

// send request from page

console.log(await createClientMock.getRequest());
```

###### Example of path parameter

```typescript
const createClientMock = mocketeer.mockREST(
    {
        method: 'POST',
        url: '/api/client/:id',
    },
    {
        status: 201,
        body: {
            clientId: 12345,
        },
    }
);

// send request from page
const request = await createClientMock.getRequest();

console.log(request.params.id);
```

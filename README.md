# Mocketeer

Easy API requests mocking using Puppeteer - for UI testing and more.

## Install

```
yarn add @hltech/puppeteer
```

## Example

```
import puppeteer from "puppeteer";
import {Mocketeer} from "mocketeer";

(async () => {

    // Setup puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://example.com');

    // Create Mocketeer instance
    const mocketeer = new Mocketeer({origin: 'https://example.com'});
    await mocketeer.activate(page);

    // Set up a mock
    const mock = await mocketeer.addRestMock({
        method: 'POST',
        path: '/api/endpoint'
    }, {
        status: 200,
        body: {
           error: false
        }
    });

    // Do something on the page
    await page.type('.email', 'email@example.com');
    await page.click('.submit-button');

    // Wait for mock to be called and verify request content
    await mock.waitForRequest();
    console.log(mock.getRequest().method); // POST
    console.log(mock.getRequest().body);   // { email: "email@example.com" ... }

})();
```

## API

### `Mocketeer`

Main class used to set up request interception and adding mock request.

### `HTTPMock`

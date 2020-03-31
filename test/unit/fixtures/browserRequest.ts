import { makeFactory } from 'factory.ts';
import { parse } from 'url';
import { BrowserRequest } from '../../../src/controllers/BrowserController';

export const browserRequest = makeFactory<BrowserRequest>({
    url: '/',
    method: 'GET',
    path: '',
    hostname: '',
    body: '',
    type: 'xhr',
    headers: {},
    query: {},
    sourceOrigin: '',
})
    .withDerivation('path', req => parse(req.url).pathname || '')
    .withDerivation('hostname', req => parse(req.url).hostname || '')
    .withDerivation('query', req => parse(req.url, true).query || {})
    .withDerivation('hostname', req => {
        const { protocol, host } = parse(req.url);
        return `${protocol}//${host}`;
    })
    .withDerivation('sourceOrigin', req => req.hostname);

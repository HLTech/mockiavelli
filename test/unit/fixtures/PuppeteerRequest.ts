import { parse } from 'url';
import { PuppeteerRequest } from '../../../src/controllers/PuppeteerController';

/**
 * Test implementation of puppeteer Request interface
 */
export class PuppeteerRequestMock implements PuppeteerRequest {
    private _postData: string = '';
    private _url: string = '';
    private _method: ReturnType<PuppeteerRequest['method']> = 'GET';
    private _headers = {};
    private _resourceType: ReturnType<PuppeteerRequest['resourceType']> = 'xhr';
    private _isNavigationRequest: boolean = false;
    private _frame = null;
    private _redirectChain: PuppeteerRequestMock[] = [];
    private _response: Response | null = null;

    public static create(
        data: Partial<{
            postData: string;
            url: string;
            method: ReturnType<PuppeteerRequest['method']>;
            headers: ReturnType<PuppeteerRequest['headers']>;
            resourceType: ReturnType<PuppeteerRequest['resourceType']>;
            isNavigationRequest: boolean;
            frame: ReturnType<PuppeteerRequest['frame']>;
            redirectChain: PuppeteerRequestMock[];
            response: Response;
            origin: string;
        }>
    ) {
        const req = new PuppeteerRequestMock();

        if (data.postData !== undefined) {
            req._postData = data.postData;
        }

        if (data.url !== undefined) {
            req._url = data.url;
        }

        if (data.method !== undefined) {
            req._method = data.method;
        }

        if (data.headers !== undefined) {
            req._headers = data.headers;
        }

        if (data.isNavigationRequest !== undefined) {
            req._isNavigationRequest = data.isNavigationRequest;
        }

        if (data.redirectChain) {
            req._redirectChain = data.redirectChain;
        }

        if (data.resourceType) {
            req._resourceType = data.resourceType;
        }

        if (data.response) {
            req._response = data.response;
        }

        if (data.origin !== undefined) {
            // @ts-ignore
            req._frame = new FrameFixture(data.origin);
        } else {
            const { protocol, host } = parse(req._url);
            const origin = `${protocol}//${host}`;
            // @ts-ignore
            req._frame = new FrameFixture(origin);
        }

        return req;
    }

    postData() {
        return this._postData;
    }

    url() {
        return this._url;
    }

    method() {
        return this._method;
    }

    headers() {
        return this._headers;
    }

    resourceType() {
        return this._resourceType;
    }

    isNavigationRequest() {
        return this._isNavigationRequest;
    }

    frame() {
        return this._frame;
    }

    redirectChain() {
        return this._redirectChain;
    }

    response() {
        return this._response;
    }

    respond = jest.fn().mockResolvedValue(undefined);
    abort = jest.fn().mockResolvedValue(undefined);
    continue = jest.fn().mockResolvedValue(undefined);
    failure = jest.fn().mockResolvedValue(undefined);
}

class FrameFixture {
    constructor(private _url: string) {}

    url() {
        return this._url;
    }
}

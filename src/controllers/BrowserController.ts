import { QueryObject } from '../types';

/**
 * Interface used by Mockiavelli to communicate with browser automation libraries
 */
export interface BrowserController {
    startInterception(): Promise<void>;
    stopInterception(): Promise<void>;
}

/**
 * Callback function called whenever a request is intercepted in the browser
 */
export type BrowserRequestHandler = (
    request: BrowserRequest,
    respond: (response: ResponseData) => Promise<void>,
    skip: () => void
) => void;

/**
 * Represents data of intercepted browser request
 */
export interface BrowserRequest {
    type: BrowserRequestType;
    method: string;
    url: string;
    headers: Record<string, string>;
    body: any;
    path: string;
    hostname: string;
    query: QueryObject;
    sourceOrigin: string;
}

/**
 * Content of response
 */
export interface ResponseData {
    status: number;
    body?: Buffer | string;
    headers?: Record<string, string>;
}

export type BrowserRequestType =
    | 'document'
    | 'stylesheet'
    | 'image'
    | 'media'
    | 'font'
    | 'script'
    | 'texttrack'
    | 'xhr'
    | 'fetch'
    | 'eventsource'
    | 'websocket'
    | 'manifest'
    | 'other';

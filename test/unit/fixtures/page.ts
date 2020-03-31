import { Page } from 'puppeteer';

export const createMockPage = (): jest.Mocked<Page> =>
    ({
        setRequestInterception: jest.fn().mockResolvedValue(''),
        on: jest.fn(),
        url: jest.fn().mockResolvedValue(''),
        // @ts-ignore
        _triggerRequest: req => this.on.mock.calls[0][1](req),
    } as any);

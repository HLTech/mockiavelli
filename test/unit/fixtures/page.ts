import { Page } from 'puppeteer';

export const createMockPage = (): jest.Mocked<Page> =>
    ({
        setRequestInterception: jest.fn().mockResolvedValue(''),
        on: jest.fn(),
        url: jest.fn().mockResolvedValue(''),
    } as any);

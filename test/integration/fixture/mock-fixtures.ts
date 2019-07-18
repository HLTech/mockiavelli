import { RequestFilter } from '../../../src/types';

export const requestGetFoo: RequestFilter = {
    method: 'GET',
    url: '/foo',
};

export const requestGetFooWithQuery: RequestFilter = {
    method: 'GET',
    url: '/foo',
    query: {
        param: 'fooParam',
    },
};

export const requestPostFoo: RequestFilter = {
    method: 'POST',
    url: '/foo',
};

export const response200Empty = {
    status: 200,
    body: {},
};

export const response200Ok = {
    status: 200,
    body: { payload: 'OK' },
};

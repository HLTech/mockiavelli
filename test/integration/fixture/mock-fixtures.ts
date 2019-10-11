import { RequestMatcherObject, RequestMatcherShort } from '../../../src/types';

export const requestFoo: RequestMatcherShort = {
    url: '/foo',
};

export const requestFooWithQuery: RequestMatcherShort = {
    url: '/foo',
    query: {
        param: 'fooParam',
    },
};

export const requestGetFoo: RequestMatcherObject = {
    method: 'GET',
    url: '/foo',
};

export const requestGetFooWithQuery: RequestMatcherObject = {
    method: 'GET',
    url: '/foo',
    query: {
        param: 'fooParam',
    },
};

export const requestPostFoo: RequestMatcherObject = {
    method: 'POST',
    url: '/foo',
};

export const requestPutFoo: RequestMatcherObject = {
    method: 'PUT',
    url: '/foo',
};

export const requestDeleteFoo: RequestMatcherObject = {
    method: 'DELETE',
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

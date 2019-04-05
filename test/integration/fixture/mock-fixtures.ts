import {RequestFilter} from "../../../src/types";

export const requestGetFoo: RequestFilter = {
    method: 'GET',
    path: '/foo'
};


export const requestPostFoo: RequestFilter = {
    method: 'POST',
    path: '/foo'
};

export const response200Empty = {
    status: 200,
    body: {}
};

export const response200Ok = {
    status: 200,
    body: {payload: "OK"}
}
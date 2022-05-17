import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
const should = chai.should(); chai.use(chaiHttp);

import { ShoppingApplicationRestApiServer } from './ShoppingApplicationRestApiServer';
import { RUN_SPECS } from '../model/ShoppingApplication.specs';
import { ShoppingApplicationOverRestApi } from './ShoppingApplicationOverRestApi';
const shoppingApplicationRestApiServer = new ShoppingApplicationRestApiServer();
const expressServer = shoppingApplicationRestApiServer.expressApp;
const app = new ShoppingApplicationOverRestApi(async ({
    method = 'get' as 'get' | 'post' | 'put' | 'delete',
    url = '' as string,
    body = null as any,
    responseType = 'json' as 'arraybuffer' | 'blob' | 'text' | 'json',
    headers = {} as { [header: string]: string | string[]; }
}) => {
    const request = chai.request(expressServer)[method](`/${url}`).set({ 'authorization': app.authenticated?.token || '', ...headers }).send(body);
    const response = await request.catch(error => error.response);
    shoppingApplicationRestApiServer.dao;
    if (response.status >= 400) {
        throw new Error(response.body?.error || response.body || response.text);
    }
    else return responseType === 'text' ? response.text : response.body;
});

RUN_SPECS(app);

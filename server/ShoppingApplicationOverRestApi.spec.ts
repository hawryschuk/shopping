// we run this test manually because it requires us to manually start the server running locally on port 8001

import axios from 'axios';
import { ShoppingApplicationOverRestApi as ShoppingApplicationOverRestApi } from './ShoppingApplicationOverRestApi';
import { ShoppingApplication } from '../model';
import { RUN_SPECS, expectError } from '../model/ShoppingApplication.specs';
import { Util } from '../model';
const app = new ShoppingApplicationOverRestApi(async ({
    method = 'get',
    url = '',
    body = null as any,
    responseType = 'json' as 'arraybuffer' | 'blob' | 'text' | 'json',
    headers = {} as { [header: string]: string | string[]; }
}) => {
    // console.log({ method, url, body, responseType, headers })
    const response: any = await axios({
        method,
        url: `http://localhost:8002/${url}`,
        data: body,
        headers: { 'authorization': app.authenticated?.token || '', ...headers },
    }).catch(error => error.response || error);
    if (response.status >= 400) throw new Error(response.data?.error || response.data);
    else return response.data;
});

RUN_SPECS(<ShoppingApplication>app);

/** When the application blocks before making a dao request, here we can go straight to a dao call */
describe('Data security : Rest API', () => {
    it('disallows unauthenticated users from getting Stores and Users', async () => {
        await app.authenticate('', '');
        await expectError(() => app.dao.retrieve('Store'), 'unauthenticated');
        await expectError(() => app.dao.retrieve('User'), 'unauthenticated');
    });
});

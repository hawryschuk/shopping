import { RestDAO } from './dao.resti.api';
import { MinimalHttpClient } from './http.client';
import { Purchase, ShoppingApplication, Store, User, Util } from '../model';

export class ShoppingApplicationOverRestApi extends ShoppingApplication {
    constructor(public httpClient: MinimalHttpClient) {
        super(new RestDAO(httpClient));
    }

    async authenticate(email: string, Password: string): Promise<boolean> {
        this.authenticated = { error: 'unauthenticated', user: null as any, token: null as any };
        if (this.authenticated = email && await this
            .httpClient({
                method: 'post',
                url: 'auth',
                body: { email, Password },
            })
        )
            this.authenticated.user &&= new User(this.authenticated.user)
        return !!this.authenticated?.user;
    }

    async signup(user: User): Promise<User> {
        await user.assign(await this.httpClient({
            method: 'post',
            url: `signup`,
            body: user
        }));
        const existing = await (this.dao as RestDAO).getCached(user, () => user);
        if (existing !== user) await existing.assign(user);
        return existing;
    }

    /** User::Shopper */
    async purchase(purchase: Purchase): Promise<{
        store: Store;
        user: User;
        purchase: Purchase;
    }> {
        const user = purchase.Shopper = this.user;  // adjusts shopper_id
        const store = purchase.Store = this.store;  // adjusts menu inventory and purchase_ids
        const result = await this.httpClient({
            method: 'post',
            url: `Store/${this.store.id}/purchase`,
            body: purchase
        });
        await user.assign(result.user);
        await store.assign(result.store);
        await purchase.assign(result.purchase);
        return { store, user, purchase };
    }

}
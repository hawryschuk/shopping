// tslint:disable-next-line:no-implicit-dependencies
import express, { response } from 'express';
import { User, ShoppingApplication, Util, Purchase, Store } from '../model';
import { encode, decode } from 'jwt-simple';
import { appendFile } from 'fs';

/** DomainApplication */
export class ShoppingApplicationRestApiServer {
    constructor(
        public businessApp: ShoppingApplication = new ShoppingApplication,
        tokenSigningPrivateKey = 'RR2021'
    ) {
        businessApp.encodeToken = async (user: User) => encode({ user, expiration: (new Date().getTime() + 1000 * 60 * 15) }, tokenSigningPrivateKey);
        businessApp.decodeToken = async (token: string) => {
            const { user, expiration } = Util.safely(() => decode(token, tokenSigningPrivateKey)) || {};
            const validUser = expiration > new Date().getTime() && <User>await this.dao.retrieve(new User(user));
            return validUser;
        }
    }

    get dao() { return this.businessApp.dao }
    delay = 0;

    expressApp = express()
        .use(require('cors')({ origin: true }))
        .use(require('body-parser').json())
        .use((req, res, next) => { res.append('x-shopping-rest-api-version', '1.0.0'); next(); })
        .use('/', express.static('../client/dist'))
        .use((req, res, next) => Util.pause(this.delay).then(next))

        /** for testing */
        .get('/delay', async ({ params: { amount = '1000' } }, res) => {
            this.delay = parseInt(amount);
            res.status(200).end();
        })

        .get('/data', (req, res) => {
            res.status(200).json((this.businessApp.dao as any).data)
        })

        .post('/signup', async ({ body }, res) => {
            try {
                const object = await this.businessApp.signup(new User(body));
                res.status(201).json(object);
            } catch (e) {
                res.status(403).json({ error: e.message });
            }
        })

        .post('/auth', async ({ body: { email, Password } }, res) => {
            try {
                res.status(await this.businessApp.authenticate(email, Password)
                    ? 200
                    : 401);
            } catch (e) {
                this.businessApp.authenticated.error = e.message;
                res.status(401);
            }
            res.json(this.businessApp.authenticated);
        })

        .post('/Store/:store_id/purchase', async ({ headers: { authorization: token }, body, params: { store_id } }, res) => {
            const valid = await this.businessApp.validate(token);
            if (!valid) return res.status(401).json({ error: 'unauthenticated' });
            const purchase = new Purchase(body);
            this.businessApp.store = await this.businessApp.retrieve(new Store(<Store>{ id: store_id }));
            // console.log({ auth: this.businessApp.authenticated, store: this.businessApp.store, user: this.businessApp.user })
            const result = await this.businessApp.purchase(purchase);
            res.status(200).json(result);
        })

        /** @example: Store, User, Purchase */
        .post(['/:collection', '/:collection/:model_id'], async ({ headers: { authorization: token }, body, params: { collection } }, res) => {
            if (!await this.businessApp.validate(token)) return res.status(401).json({ error: 'unauthenticated' });
            const klass = ShoppingApplication.models[collection];
            if (!klass) {
                res.status(404).json({ error: 'unknown-collection' });
            } else {
                const object = new klass(body);
                const existing = await this.businessApp.dao.retrieve(object);
                try {
                    if (existing) throw new Error('object already exists')
                    await this.businessApp.create(object);
                    res.status(201).json(object);
                } catch (e) {
                    res.status(403).json({ error: e.message });
                }
            }
        })

        .get('/:collection', async ({ headers: { authorization: token }, params: { collection } }, res) => {
            if (!(await this.businessApp.validate(token))) return res.status(401).json({ error: 'unauthenticated' });
            try {
                const klass = ShoppingApplication.models[collection];
                if (klass) {
                    const objects = await this.businessApp.retrieve(collection);
                    res.status(200).json(objects);
                } else {
                    res.status(404).end();
                }
            } catch (e) {
                console.log('uh oh !!!')
                res.status(403).send({ error: e.message });
            }
        })

        .get('/:collection/:id', async ({ headers: { authorization: token }, body, params: { collection, id } }, res) => {
            if (!await this.businessApp.validate(token)) return res.status(401).json({ error: 'unauthenticated' });
            try {
                const klass = ShoppingApplication.models[collection];
                if (!klass) throw new Error('unknown collection');
                const object: any = await this.businessApp.retrieve(new klass({ id }));
                res.status(object ? 200 : 404).json(object);
            } catch (e) {
                res.status(403).send({ error: e.message });
            }
        })

        .put('/:collection/:id', async ({ headers: { authorization: token }, body, params: { collection, id } }, res) => {
            if (!await this.businessApp.validate(token)) return res.status(401).json({ error: 'unauthenticated' }); const klass = ShoppingApplication.models[collection];
            const object: any = klass && await this.dao.retrieve(new klass({ id }));
            if (!object) {
                res.status(404).end();
            } else {
                try {
                    const updated = await this.businessApp.update(object, body);
                    res.status(200).json(updated);
                } catch (e) {
                    res.status(403).send({ error: e.message });
                }
            }
        })

        .delete('/:collection/:id', async ({ headers: { authorization: token }, params: { collection, id } }, res) => {
            const validated = await this.businessApp.validate(token);
            const equals = this.businessApp.authenticated.user === validated;
            if (!(validated)) return res.status(401).json({ error: 'unauthenticated' }); const klass = ShoppingApplication.models[collection];
            const object: any = klass && await this.dao.retrieve(new klass({ id }));
            if (!object) {
                res.status(404).end();
            } else {
                try {
                    // console.log('TRYING TO DELETE', {
                    //     equals,
                    //     equals2: validated === this.businessApp.authenticated,
                    //     validated,
                    //     object,
                    //     user: this.businessApp.authenticated
                    // })
                    await this.businessApp.delete(object);
                    res.status(200).json({ success: true });
                } catch (e) {
                    res.status(403).json({ error: e.message });
                }
            }
        })

}

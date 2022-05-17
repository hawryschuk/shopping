import { DAO, Model, ShoppingApplication } from '../model';
import { MinimalHttpClient } from './http.client';

/** A DAO that accesses its data through a REST API */
export class RestDAO extends DAO {
    constructor(public httpClient: MinimalHttpClient, public models: any = ShoppingApplication.models) { super(); }

    private cache: { [klassId: string]: Model<any> } = {};
    getCached(key, creator?) {
        if (key instanceof Model) key = `${key.className}:${key.id}`;
        if (key in this.cache) return this.cache[key];
        if (creator) return this.cache[key] ||= creator();
    }

    async retrieveOrCreate({ model, className, klass }) {
        const existing = await this.getCached(`${className}:${model.id}`, () => model instanceof Model ? model : new klass(model));
        if (model instanceof Model && existing !== model) await existing.assign(model);
        return existing;
    };

    async create<T>(model: Model<T>): Promise<Model<T>> {
        // console.log({ CREATE: model })
        const existing = await this.getCached(`${model.className}:${model.id}`, () => model);
        const response = await this.httpClient({ method: 'post', body: model, url: model instanceof Model ? `${model.className}/${model.id}` : model, });
        return await existing.assign(response);
    }

    async retrieve<T>(model: Model<T> | string): Promise<Model<T> | T | Model<T>[] | T[]> {
        const className: string = model instanceof Model && model.className || model as string;
        const klass = this.models[className];
        // if (className === 'Store' && (model as any).id === 'shawarma') debugger;
        const existing = this.getCached(`http-fetch:${className}:${(model as any).id}`);
        if (existing && typeof model === 'string') return Object.entries(this.cache).filter(([key, val]) => key.startsWith(`${model}:`)).map(([k, v]) => v);
        const results = await this.getCached(`http-fetch:${className}:${(model as any).id}`, async () => {
            const existing = model instanceof Model && await this.getCached(`${model.className}:${model.id}`);
            if (existing) return existing;
            else {
                const response = await this.httpClient({
                    method: 'get',
                    url: model instanceof Model ? `${className}/${model.id}` : className,
                    body: model instanceof Model && model,
                });
                const results = model instanceof Model
                    ? await this.retrieveOrCreate({ klass, className, model: response })
                    : await Promise.all(response.map(async m => await this.retrieveOrCreate({ klass, className, model: m })));
                return results;
            }
        });
        // if (model === 'Store' && results.length) debugger;
        return results;
    }

    async update<T extends Model<any>>(model: T, updates: T): Promise<T> {
        {
            const existing = await this.getCached(`${model.className}:${model.id}`);
            if (existing && model !== existing) { model = await existing.assign(model); }
        }
        {
            const invalidModel = await (await model.clone().assign(updates)).invalid();
            if (invalidModel) throw new Error('invalid: ' + invalidModel)
        }
        {
            const updated = await this.httpClient({
                method: 'put',
                url: `${model.className}/${model.id}`,
                body: updates
            });
            await model.assign(updated);
        }
        return model;
    }

    async delete<T>(model: Model<T>): Promise<void> {
        await this.httpClient({
            method: 'delete',
            url: `${model.className}/${model.id}`
        });
        delete this.cache[`${model.className}:${model.id}`];
    }
}

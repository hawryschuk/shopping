import { Model } from "./Model";
import { Util } from "./Util";

/** Basic DAO */
export abstract class DAO {
    static instance: DAO;
    constructor() { DAO.instance = this }
    abstract retrieve<T>(model: T | Model<T> | string): Promise<Model<T> | T | Model<T>[] | T[]>;
    abstract delete<T>(model: T | Model<T>): Promise<void>;
    async create<T>(model: Model<T>): Promise<Model<T>> {
        if (await model.invalid()) throw new Error(`invalid: ${await model.invalid()}`);
        if (await this.retrieve(model)) {
            throw new Error('duplicate');
        }
        if (!model.id) do { model.id = Util.UUID } while (await this.retrieve(model));
        return model;
    }
    async update<T>(model: T | Model<T>, updates: T | Model<T>): Promise<Model<T>> {
        const existing: any = await this.retrieve(model);
        if (!existing) throw new Error('non-existent');
        return existing.assign(updates);
    }
}

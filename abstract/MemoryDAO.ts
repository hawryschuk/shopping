import { DAO } from "./DAO";
import { Model } from "./Model";
import { Util } from "./Util";

/** Memory DAO : Other DAOs may be implemented (ie; SQLite, Mongo, DynamoDB, etc) */
export class MemoryDAO extends DAO {
    private data: { [className: string]: Model<any>[] & { [id: string]: Model<any> } } = {
        // Restaurant: [],
        // User: [],
    };

    private async getModels<T>(model: Model<T> | string): Promise<Model<T>[] & { [id: string]: Model<T> }> {
        const className = model instanceof Model ? model.className : model;
        return (this.data[className] ||= [] as any);
    }

    async create<T>(model: Model<T>): Promise<Model<T>> {
        await super.create(model);
        const models = await this.getModels(model);
        models.push(model);
        Object.assign(models, { [model.id as string]: model });
        return model;
    }

    async retrieve<T>(model: Model<T> | string): Promise<Model<T> | T | Model<T>[] | T[]> {
        const models = await this.getModels<T>(model);
        return model instanceof Model ? models[model.id as string] : models;
    }

    async delete<T>(model: Model<T>) {
        const models = await this.getModels(model);
        delete models[model.id as string];
        Util.removeElements(models, model);
    }
}

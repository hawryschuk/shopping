import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { DAO, Model, Util } from "../model";
export class SQLiteDAO extends DAO {
    constructor(
        public dbfile: string,
        public models: { [className: string]: any },
    ) {
        super()
    }

    db = new sqlite3.Database(this.dbfile);

    columns: { [className: string]: { name: string; }[] } = {};

    ready$ = (async () => {
        for (const className of Object.keys(this.models)) {
            await promisify((sql: string, cb: any) => this.db.run(sql, cb))(`create table if not exists ${className} (id text UNIQUE, json text not null)`);
            const cols = <{ name: string; }[]>await promisify((sql: string, cb: any) => this.db.all(sql, cb))(`SELECT name FROM PRAGMA_TABLE_INFO('${className}')`);
            this.columns[className] = cols;
        }
    })();

    async reset() {
        await Promise.all(Object
            .keys(this.models)
            .map(k => promisify((sql: string, cb: any) => this.db.run(sql, cb))(`delete from ${k}`))
        );
    }

    getClass(model: any) { return this.models[this.getClassName(model)] }

    getClassName(model: any) {
        return model instanceof Model && model.constructor.name
            || Object.entries(this.models).map(([className, klass]) => klass === model && className).find(v => !!v)
            || typeof model === 'string' && this.models[model] && model;
    }

    async create<T>(model: Model<T>): Promise<Model<T>> {
        await super.create(model);
        const cols = this.columns[this.getClassName(model)];
        const jsonCol = cols.find(c => c.name === 'json');
        if (jsonCol) { cols.splice(cols.indexOf(jsonCol), 1); cols.push(jsonCol); }
        const params = cols.map(col => (model as any)[col.name]);
        if (jsonCol) {
            const json = Object.entries(model).reduce(
                (json: T, [key, val]) => {
                    if (!cols.find(c => c.name === key)) {
                        Object.assign(json, { [key]: val });
                    }
                    return json
                }, <T>{}
            );
            params[params.length - 1] = JSON.stringify(json, null, 2);
        }
        const sql = `insert into ${this.getClassName(model)} (${cols.map(col => col.name).join(', ')}) values (${cols.map(c => '?').join(', ')})`;
        await promisify((sql: string, params: any, cb: any) => this.db.run(sql, params, cb))(sql, params);
        return <Model<T>>model;
    }

    async update<T>(model: T | Model<T>, updates: T | Model<T>): Promise<Model<T>> {
        const updated = await super.update(model, updates);
        const cols = this.columns[this.getClassName(model)].filter(c => c.name !== 'id');
        const jsonCol = cols.find(c => c.name === 'json');
        if (jsonCol) { cols.splice(cols.indexOf(jsonCol), 1); cols.push(jsonCol); }
        const params = cols.map(col => (updated as any)[col.name]);
        if (jsonCol) {
            const json = Object.entries(updated).reduce(
                (json: T, [key, val]) => {
                    if (!cols.find(c => c.name === key) && key !== 'id') {
                        Object.assign(json, { [key]: val });
                    }
                    return json
                }, <T>{}
            );
            params[params.length - 1] = JSON.stringify(json, null, 2);
        }
        const sql = `update ${this.getClassName(model)} set ${cols.map(col => `${col.name}=?`).join(', ')} where id =? `;
        const result = await promisify((sql: string, params: any[], cb: any) => this.db.run(sql, params, cb))(sql, [...params, (model as any).id]);
        return Object.assign(model, updated);
    }

    async retrieve<T>(model: string | T | Model<T>): Promise<T | Model<T> | Model<T>[] | T[]> {
        const rows = <any[]>await promisify((sql: string, params: any, cb: any) => this.db.all(sql, params, cb))(
            model instanceof Model
                ? `select * from ${this.getClassName(model)} where id = ? `
                : `select * from ${this.getClassName(model)}`,
            [(model as any).id]
        );
        rows.forEach((row, index) => rows[index] = new (this.getClass(model))({ ...JSON.parse(row.json), ...row }));
        return model instanceof Model ? rows[0] : rows;
    }

    async delete<T>(model: T | Model<T>): Promise<void> {
        await promisify((sql: string, params: any, cb: any) => this.db.run(sql, params, cb))(
            `delete from ${this.getClassName(model)} where id = ? `,
            [(model as any).id]
        );
    }

}
import { Util } from "./Util";

export abstract class Model<T> {
    static models: { [className: string]: any } = {};
    constructor(props: T = {} as T) { Object.assign(this, props) }

    id?: string = (this as any).id || Util.UUID;

    static get Application() { return import('../model').then(_ => _.ShoppingApplication.instance) }

    static async getClassInstance(klass: any, id: string) {
        const instances = (this as any)[Symbol.for('instances')] ||= {};
        const key = `${klass.name}:${id}`;
        return await (instances[key] ||= this.Application.then(app => app
            .retrieve(new klass(<any>{ id }))
            .then(o => {
                Object.assign(instances[key], o);
                return o;
            })
        ));
    }

    get className(): string {
        const [className] = Object
            .entries(Model.models)
            .find(([className, klass]) => {
                return (this instanceof klass)
                    || (this as any).constructor.name === className;
            })
            || []; // prevent mangling
        if (!className) console.log(this, new Error().stack)
        return className as string;
    }

    async invalid(): Promise<string> {
        return Object
            .keys({ id: this.id, ...this })
            .filter(key => !(this as any)[key])
            .join(', ');
    }

    async assign(updates: T | Model<T>) {     // demarshalling incoming data
        const clone = new (this as any).constructor({ ...this.clone(), ...updates });
        const invalid = await clone.invalid();
        if (invalid) throw new Error(`invalid: ${invalid}`);
        return Object.assign(this, clone);
    }

    clone(cloneModelProperties = false): any {
        const clone: T & any = new (this as any).constructor(this);
        if (cloneModelProperties)
            for (const [key, val] of Object.entries(clone)) {
                if (val instanceof Model)
                    clone[key] = val.clone(cloneModelProperties);
                else if (val instanceof Array && val[0] instanceof Model)
                    val.forEach((v, i) => clone[key][i] = v.clone(cloneModelProperties));
                else if (val instanceof Array)
                    clone[key] = [...val]
            }
        return clone;
    }
}

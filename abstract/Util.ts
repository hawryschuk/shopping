
export class Util {
    static safely(block: any, failValue?: any) { let ret: any; try { ret = block() } catch (e) { return failValue } finally { return ret } }
    static get UUID() { return new Array(32).fill(0).map(i => Math.floor(Math.random() * 0xF).toString(0xF)).join('') }
    static getError(func: any) { try { func() } catch (e) { return e } }
    static matches<T>(el: T, criteria: any): boolean {
        return Object
            .keys(criteria)
            .every(criteriaKey => (el as any)[criteriaKey] === criteria[criteriaKey]);
    }
    static findWhere<T>(arr: T[], criteria: any): T | undefined { return arr.find(el => this.matches(el, criteria)); }
    static async pause(ms: number) { await new Promise(resolve => setTimeout(resolve, ms)); }
    static backToDate = (date: Date | string): Date => <Date>(date instanceof Date ? date : (date && new Date(date)));

    private static _objectToKlass = (obj: any, klass: any) => obj instanceof klass ? obj : new klass(obj);
    static objectToInstance(object: any, klass: any) { return object instanceof Array ? object.map(o => this._objectToKlass(o, klass)) : this._objectToKlass(object, klass); }

    static removeElements<T>(arr: T[], ...elements: T[]): T[] {
        const removed = [];
        for (const element of elements) {
            const index = arr.indexOf(element);
            if (index >= 0) removed.push(...arr.splice(index, 1));
        }
        return removed;
    }
}

import { Model } from "../abstract/Model";
import { Util } from "../abstract/Util";
import { Price, PurchaseLineItem } from "./PurchaseLineItem";
import { Store } from "./Store";
import { User } from "./User";

export class Purchase extends Model<Purchase> {
    date: Date = Util.backToDate((this as any).date || new Date);
    shopper_id?: string = (this as any).shopper_id || '';
    store_id?: string = (this as any).store_id || '';
    lineitems: PurchaseLineItem[] = Util.objectToInstance((this as any).lineitems || [], PurchaseLineItem);

    get purchased() { return this.Store.then((store: Store) => store.purchase_ids.includes(this.id as string)) }

    async invalid() {
        const invalidLineItems: string | undefined = await Promise
            .all(this.lineitems.map(item => item.invalid()))
            .then(invalids => invalids.find(Boolean));
        return !(await this.purchased) && invalidLineItems && 'insufficient-inventory-for-purchase'
            || ''
    }

    completed?: Date;

    get totalCost() {
        return this.lineitems
            .reduce(
                (total, item) => {
                    const price = new Price(item.totalCost);
                    const newTotal = total.Amount + price.Amount;
                    return Object.assign(total, price, { amount: newTotal });
                },
                new Price('$0 CDN'))
            .price
    }

    cancellation?: {
        date: Date;
        reason: string;
        accepted?: Date;
    };

    get Store(): Store | any { return Model.getClassInstance(Store, this.store_id as string) }

    set Shopper(user: User) {
        this.shopper_id = user.id as string;
        if (user.purchase_ids && !user.purchase_ids.includes(this.id as string))
            user.purchase_ids.push(this.id as string);
    }

    set Store(store: Store | any) {
        if (this.lineitems.find(item => !store.getMenuItem(item.menuitem_id))) { throw new Error('invalid-menuitem'); }
        if (this.lineitems.find(item => store.getMenuItem(item.menuitem_id).inventory < item.quantity)) throw new Error('inventory-exceeded');
        this.store_id = store.id as string;
        if (store.purchase_ids)
            if (!store.purchase_ids.includes(this.id as string)) {
                store.purchase_ids.push(this.id as string);
                for (const { menuitem_id, quantity } of this.lineitems) {
                    store.getMenuItem(menuitem_id).inventory -= quantity;
                }
            }
    }
}


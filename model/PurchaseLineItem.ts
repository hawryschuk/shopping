import { Model } from "../abstract/Model";
import { MenuItem } from "./MenuItem";
import { Store } from "./Store";

export class Price {
    currencySymbol?: string;
    amount?: string;
    get Amount() { return parseFloat((String(this.amount || '')).replace(/\D/, '.') || '0') }
    currencySymbol2?: string;
    currencyCode?: string;
    constructor(price: string) {
        const [currencySymbol = '', amount = 0, currencySymbol2 = '', currencyCode = ''] = (/^(.*)(\d+[,.]\d*)(.*) (.+)$/.exec(price) || []).slice(1);
        Object.assign(this, { currencySymbol, amount, currencySymbol2, currencyCode });
    }
    get price() { return `${this.currencySymbol}${this.amount}${this.currencySymbol2} ${this.currencyCode}` }
}

export class PurchaseLineItem extends Model<PurchaseLineItem> {
    store_id!: string;
    menuitem_id?: string;
    quantity!: number;
    notes?: string;
    purchase_id?: string;

    get Store(): Promise<Store> { return Model.getClassInstance(Store, this.store_id); }

    get MenuItem() { return this.Store.then(async store => store.getMenuItem(this.menuitem_id as string)); }

    unit_price: string = (this as any).unit_price || '';

    get Price() { return new Price(this.unit_price) }

    get description() { return this.MenuItem.then((m: MenuItem) => m.name); }

    get totalCost() { return Object.assign(this.Price, { amount: this.Price.Amount * this.quantity }).price }

    async invalid() {
        const insufficient = !this.purchase_id && (await this.MenuItem).inventory < this.quantity;
        return insufficient && 'insufficient-inventory-for-lineitem' || ''
    }
}

const md5 = require('md5');
import { Model } from "../abstract/Model";
import { Store } from "./Store";
import { Util } from "../abstract/Util";
import { Purchase } from "./Purchase";
import { MenuItem } from "./MenuItem";
import { Price, PurchaseLineItem } from "./PurchaseLineItem";

export enum UserCategory { Admin = 'Admin', Shopper = 'Shopper', StoreOwner = 'StoreOwner' }

export class User extends Model<User> {
    set Password(p: string) { this.password = md5(p); }
    authenticate(p: string) { return md5(p) === this.password }
    owns(store: Store) { return store.owner_email === this.email }

    email!: string;
    password?: string;
    name!: string;
    created?: Date = Util.backToDate((this as any).created || new Date());
    category!: UserCategory;

    purchase_ids: string[] = (this as any).purchase_ids || [];

    get purchases(): Promise<Purchase[]> {
        return (async () => {
            const { ShoppingApplication: { instance: app } } = await import('./ShoppingApplication');
            const purchases = await <any>Promise.all(this.purchase_ids.map(id =>
                app.retrieve(new Purchase(<Purchase>{ id }))
            ));
            return purchases;
        })();
    }

    cart: PurchaseLineItem[] = Util.objectToInstance((this as any).cart || [], PurchaseLineItem);
    // cart { items; add(store,menuitem); invalid(); purchases; totalCost; }

    addToCart(menuitem: MenuItem, store: Store) {
        const existing = Util.findWhere(this.cart, { menuitem_id: menuitem.id });
        if (existing) existing.quantity++;
        else this.cart.push(new PurchaseLineItem(<PurchaseLineItem>{
            store_id: store.id,
            menuitem_id: menuitem.id as string,
            quantity: 1,
            notes: '',
            unit_price: menuitem.price,
        }));
        return this;
    }

    get cartInvalid() {
        return Promise
            .all(this.cartPurchases.map(purchase => purchase.invalid()))
            .then(invalids => {
                const someInvalid = invalids.some(Boolean);
                if (someInvalid) debugger;
                return someInvalid
            })
    }

    get cartPurchases() {
        return this.cart.reduce((purchases, lineitem) => {
            let purchase = Util.findWhere(purchases, { store_id: lineitem.store_id });
            !purchase && purchases.push(purchase = new Purchase(<Purchase>{ store_id: lineitem.store_id }));
            purchase.lineitems.push(lineitem);
            return purchases;
        }, [] as Purchase[])
    }

    get cartTotal() {
        return this.cart
            .reduce(
                (total, item) => {
                    const price = new Price(item.totalCost);
                    const newTotal = total.Amount + price.Amount;
                    return Object.assign(total, price, { amount: newTotal });
                },
                new Price('$0 CDN'))
            .price
    }

    async invalid(): Promise<string> {
        const invalid: string = !/@/.test(this.email) && 'email'
            || !this.name && 'name'
            || (!this.password || this.authenticate('')) && 'password'
            || !(this.created instanceof Date) && 'created'
            || (await this.cartInvalid) && 'cart-exceeded-inventory'
            || !Object.values(UserCategory).includes(this.category) && 'category'
            || '';
        return (await super.invalid()) || invalid;
    }
}


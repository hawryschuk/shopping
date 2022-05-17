import { Model } from "../abstract/Model";
import { Util } from "../abstract/Util";
import { MenuItem } from "./MenuItem";
import { Purchase } from "./Purchase";
import { User } from "./User";

export class Store extends Model<Store> {
    owner_email!: string;

    ownedBy(user: User) { return user.owns(this) }

    name: string = (this as any).name || '';

    address: string = (this as any).address || '';

    menu: MenuItem[] = Util.objectToInstance((this as any).menu || [], MenuItem);

    get inventory() {
        return this.menu.reduce((inv, item) => {
            return Object.assign(inv, { [item.id as string]: item.inventory })
        }, {})
    }

    replenishments: { menuitem_id: string; quantity: number; date: Date; }[] = (this as any).replenishments || [];

    purchase_ids: string[] = (this as any).purchase_ids || [];

    get purchases(): Promise<Purchase[]> { return Model.Application.then(app => Promise.all(this.purchase_ids.map(id => app.retrieve(new Purchase({ id } as any))))); }

    get purchasesPendingCompletion() { return this.purchases.then(purchases => purchases.filter(p => !p.completed)) }

    get calculateInventory() {
        return (async () => {
            const inventory: { [menuitem_id: string]: number } = {};
            for (const { menuitem_id, quantity } of this.replenishments) {
                (inventory[menuitem_id] ||= 0);
                inventory[menuitem_id] += quantity;
            }
            for (const p of await this.purchases)
                for (const { menuitem_id, quantity } of p.lineitems)
                    inventory[menuitem_id as string] -= quantity;
            Object
                .keys(inventory)
                .filter(id => !Util.findWhere(this.menu, { id }))
                .forEach(id => delete inventory[id]);
            return inventory;
        })();
    }

    getMenuItem(id: string): MenuItem { return this.menu.find(i => i.id === id) as MenuItem }

    purchase(purchase: Purchase) {
        this.purchase_ids.push(purchase.id as string);
        for (const { menuitem_id, quantity } of purchase.lineitems)
            this.getMenuItem(menuitem_id as string).inventory -= quantity;
        return this;
    }

    replenish(...items: { menuitem_id: string; quantity: number; }[]) {
        const { replenishments, inventory } = this;
        for (const { menuitem_id, quantity } of items) {
            replenishments.push({ menuitem_id, quantity, date: new Date });
            this.getMenuItem(menuitem_id).inventory += quantity;
        }
        return this;
    }

    async invalid() {
        const withoutEmpty = (o: any) => Object
            .entries(o)
            .filter(([k, v]) => v)
            .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
        const stringify = (o: any) => JSON.stringify(withoutEmpty(o), Object.keys(o).sort());
        const calculated = stringify(await this.calculateInventory);
        const actual = stringify(this.inventory);
        return calculated !== actual && 'inventory'
            || !this.name && 'name'
            || '';
    }

}

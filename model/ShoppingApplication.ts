import { MenuItem } from "./MenuItem";
import { Purchase } from "./Purchase";
import { DAO } from "../abstract/DAO";
import { MemoryDAO } from "../abstract/MemoryDAO";
import { Model } from "../abstract/Model";
import { Store } from "./Store";
import { User, UserCategory } from "./User";
import { Util } from "../abstract/Util";
import { PurchaseLineItem } from "./PurchaseLineItem";

/** In a typical scenario, the server may run an Application with a DynamoDB DAO,
 * and the client may run an Application with a REST API DAO.
 * In a development/testing scenario, the client/server may run the application with a MemoryDAO */
export class ShoppingApplication {
    static instance: ShoppingApplication;
    static models = Model.models = { User, Store, Purchase };

    constructor(public dao: DAO = new MemoryDAO) { ShoppingApplication.instance = this };

    private async getUser(email: string): Promise<User> { return (await this.Users).find(u => u.email === email) as User; }

    get Stores(): Promise<Store[]> { return this.retrieve('Store') as any }

    get Users(): Promise<User[]> { return this.dao.retrieve('User') as Promise<User[]> }

    get Purchases() { return this.dao.retrieve('Purchase') as Promise<Purchase[]> }

    get MyStores() { return this.Stores.then(stores => stores.filter(store => this.user.owns(store))) }

    /** Reset the database to no records except the admin user: authenticated.user must be admin */
    async reset() {
        const users = await this.Users;
        const purchases = await this.Purchases;
        const stores = await this.Stores;
        ((this.dao as any).cache &&= {})
        for (const user of [...users]) {
            if (user.id !== this.authenticated.user.id) {
                await this.dao.delete(user);
                // console.log({ DELETE: user })
            } else {
                await this.dao.update(user, <any>{ cart: [], purchase_ids: [] });
                // console.log({ UPDATE_RESET_USER: user })
            }
        }
        // console.log(`RESET ${stores.length} stores`)
        for (const store of [...stores]) {
            await this.dao.delete(store);
            // console.log({ DELETE: store })
        }
        // console.log(`RESET ${purchases.length} purchases`)
        for (const purchase of [...purchases]) {
            await this.dao.delete(purchase);
            // console.log({ DELETE: purchase })
        }
        // console.log('/finished reset')
    }

    async signup(user: User): Promise<User> {   // sign up 
        const users = await this.Users;
        const duplicate = users.find(u => u.email.toLocaleLowerCase() === user.email.toLocaleLowerCase());
        const invalid = await user.invalid();
        if (users.length && ![UserCategory.Shopper, UserCategory.StoreOwner].includes(user.category)) throw new Error('signup-as-owner-regular-only');
        if (duplicate) throw new Error('duplicate-user');
        if (invalid) throw new Error('invalid-user-' + invalid);
        return <User>await this.dao.create<User>(user);
    }

    /** Stub token encoder/decoder : A ClientServer system may use JWTs or some other cryptography */
    public encodeToken = async (user: User): Promise<string> => user.id as string;
    public decodeToken = async (token: string): Promise<User> => <User>await this.dao.retrieve(new User(<User>{ id: token }));

    async validate(token: string): Promise<any> {
        this.authenticated = { error: 'unauthenticated' } as any;
        const user = await this.decodeToken(token);
        Object.assign(this.authenticated, { user, token, error: !user && 'invalid-token' })
        return this.authenticated.user;
    }

    async authenticate(email: string, password: string): Promise<boolean> {
        this.store = null as any;
        this.authenticated = { error: 'unauthenticated', user: null as any, token: null as any };
        if (!email) return false;
        const user = await this.getUser(email);
        if (!user) throw new Error('unknown user');
        if (!await user.authenticate(password)) throw new Error('invalid password');
        this.authenticated = { user, token: await this.encodeToken(user) };
        return !!this.authenticated.user;
    }

    authenticated: { user: User; token: string; error?: string } = null as any;
    get user(): User { return this.authenticated?.user }
    store: Store = null as any;


    async checkout() {
        await Promise.all(this.user.cartPurchases.map(purchase => this.purchase(purchase)));
        await this.update(this.user, <any>{ cart: [] });
    }

    async editMenuItem(store: Store, menuitemToEdit: MenuItem, editedMenuItem: MenuItem) {
        const quantity = editedMenuItem.inventory - menuitemToEdit.inventory;
        if (quantity) await this.replenish({ menuitem_id: menuitemToEdit.id as string, quantity });
        await this.update(store, <Store>{ menu: store.menu.map(item => item === menuitemToEdit ? editedMenuItem : item) });
    }

    /** Shopper Use Case # 1 : Purchase items : Purchase, Store, Shopper */
    async purchase(purchase: Purchase): Promise<{
        store: Store;
        user: User;
        purchase: Purchase;
    }> {
        const user = purchase.Shopper = this.user;  // adjusts shopper_id
        const store = purchase.Store = this.store;  // adjusts menu inventory and purchase_ids
        const cart = user.cart.filter(cartitem => !purchase.lineitems.find(lineitem => lineitem.store_id === cartitem.store_id))
        purchase.lineitems.forEach(item => (item.purchase_id = purchase.id));
        await this.create(purchase);
        await this.dao.update(user, { purchase_ids: user.purchase_ids, cart } as any);
        await this.dao.update(store, { purchase_ids: store.purchase_ids, menu: store.menu } as any);
        return { store, user, purchase };
    }


    async addMenuItem(store: Store, menuitem: MenuItem) {
        const quantity = menuitem.inventory;
        const menu = [...store.menu, Object.assign(menuitem, { inventory: 0 })];
        debugger;
        await this.update(store, <Store>{ menu });
        quantity && await this.replenish({ menuitem_id: menuitem.id as string, quantity });
    }

    async deleteMenuitem(store: Store, menuitem: MenuItem) {
        const menu = [...store.menu]; Util.removeElements(menu, menuitem);
        await this.update(store, <Store>{ menu });
    }

    /** Store Owner Use Case # 1 : Replenish Inventory */
    async replenish(...menuitems: { menuitem_id: string; quantity: number; }[]) {
        if (!this.user.owns(this.store)) throw new Error('only-store-owner-can-replenish');
        await this.store.replenish(...menuitems);
        await this.dao.update(this.store, <any>{ replenishments: this.store.replenishments, menu: this.store.menu });
    }

    /** Only the store owner can complete a purchase */
    async complete(purchase: Purchase) {
        await this.update(purchase, { completed: new Date } as any);
    }

    /** Shopper adds a menuitem to their cart */
    async addToCart(menuitem: MenuItem) {
        if (await this.user.clone(true).addToCart(menuitem, this.store).invalid()) {
            throw new Error('insufficient-inventory-to-add-to-cart');
        } else {
            this.user.addToCart(menuitem, this.store)
            await this.update(this.user, <User>{ cart: this.user.cart });
        }
    }

    async removeItemFromCart(cartItem: PurchaseLineItem) {
        const { cart } = this.user;
        Util.removeElements(cart, cartItem);
        debugger;
        await this.update(this.user, <User>{ cart });
    }

    //#region CRUD : User/Store ( Admin )
    async create<T>(model: Model<T>): Promise<Model<T>> {
        // if (model instanceof Purchase) debugger;
        const user = this.user;
        if (!user) throw new Error('unauthenticated');
        if (model instanceof User && await this.getUser(model.email)) throw new Error('duplicate-user');
        if (model instanceof Store && ![UserCategory.Admin, UserCategory.StoreOwner].includes(user?.category)) throw new Error('only store-owners may create stores');
        if (model instanceof Store && model) Object.assign(model, { owner_email: user.email });
        // if (model instanceof Purchase && model) Object.assign(model, { Shopper: this.user, Store: this.store });
        return await this.dao.create(model);
    }

    async retrieve<T>(model: T | Model<T> | string) {
        if (!this.authenticated?.user) throw new Error('unauthenticated');
        const { user } = this.authenticated;
        if (model instanceof User && user?.id !== model.id && user?.category !== UserCategory.Admin) throw new Error('get-self-profile');                        // get [self] user profile
        if (model === 'User' && user?.category !== UserCategory.Admin) throw new Error('admin-get-all-users');                                                   // admins can get all users
        model = <T>await this.dao.retrieve(model);
        if (model instanceof Purchase && !(
            model.shopper_id === user.id                                        // user is the shopper
            || user.category === UserCategory.Admin                             // user is admin
            || Util.findWhere(await this.MyStores, { id: model.store_id })      // user is the store owner
        )) throw new Error('neither-shopper-seller-admin');
        return model;
    }

    async update<T>(model: T | Model<T>, updates: T | Model<T>) {
        if (!model) debugger;
        const { user } = this.authenticated;
        const store: Store = <Store>(model instanceof Purchase && <Store>await this.retrieve(new Store(<Store>{ id: model.store_id })));
        const isStoreUpdate = model instanceof Store && this.authenticated.user.owns(model);
        const isUserUpdate = model instanceof User && model.id === this.authenticated.user.id && Object.keys(updates).every(key => ['cart'].includes(key));
        const isPurchaseUpdate = model instanceof Purchase && this.authenticated.user.owns(store) && Object.keys(updates).every(key => ['completed'].includes(key));
        const isAdmin = user?.category === UserCategory.Admin;
        const isValid = [isAdmin, isStoreUpdate, isPurchaseUpdate, isUserUpdate].includes(true);
        if (!isValid) { debugger; throw new Error('unauthorized'); }// + JSON.stringify({ isAdmin, isStoreUpdate, isPurchaseUpdate, isUserUpdate }));
        return await this.dao.update(model, updates);
    }

    async delete<T>(model: Model<T>) {
        const { user } = this.authenticated;
        if (user?.id === model.id) throw new Error('no-self-deletions');
        if (user?.category !== UserCategory.Admin) throw new Error('admin-deletions-only');                                                                     // admin can delete anything
        return await this.dao.delete(model);
    }
    //#endregion CRUD
}

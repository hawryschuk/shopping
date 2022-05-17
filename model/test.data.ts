import { MenuItem, Purchase, Store, ShoppingApplication, User, UserCategory } from './index';
import { Model } from '../abstract/Model';
import { PurchaseLineItem } from './PurchaseLineItem';

export interface ITEST_DATA {
    adminUser: User;
    ownerUser: User;
    ownerUser2: User;
    shopperUserWithPurchase: User;
    shopperUserNoPurchases: User;

    storeUnposted: Store;
    storeNoProducts: Store;
    storeWithProductsNoneBought: Store;
    storeWithProductsSomeBought: Store;

    purchase1: Purchase;
    purchase2: Purchase;
};

export const SETUP_TEST_DATA = async (app: ShoppingApplication): Promise<ITEST_DATA> => {
    const test_data: ITEST_DATA = {
        adminUser: new User(<User>{ id: 'admin', created: new Date('2021-05-08'), category: UserCategory.Admin, email: 'alex+admin@hawryschuk.com', Password: '2021', name: 'Alex Hawryschuk - Admin' }),
        ownerUser: new User(<User>{ id: 'owner', created: new Date('2021-05-08'), category: UserCategory.StoreOwner, email: 'alex+owner@hawryschuk.com', Password: '2021', name: 'Alex Hawryschuk - Owner' }),
        ownerUser2: new User(<User>{ id: 'owner2', created: new Date('2021-05-08'), category: UserCategory.StoreOwner, email: 'alex+owner2@hawryschuk.com', Password: '2021', name: 'Alex Hawryschuk - Owner2' }),
        shopperUserWithPurchase: new User(<User>{ id: 'shopper1', created: new Date('2021-05-08'), category: UserCategory.Shopper, email: 'alex+regular1@hawryschuk.com', Password: '2021', name: 'Alex Hawryschuk - Shopper1' }),
        shopperUserNoPurchases: new User(<User>{ id: 'shopper2', created: new Date('2021-05-08'), category: UserCategory.Shopper, email: 'alex+regular2@hawryschuk.com', Password: '2021', name: 'Alex Hawryschuk - Shopper2' }),

        storeUnposted: new Store(<Store>{ name: `Tim Hortons`, address: 'Barrhaven Road, Ottawa, Canada' }),
        storeNoProducts: new Store(<Store>{ name: `Montana's BBQ & Bar`, address: '4230 Innes Road, Ottawa, Canada' }),
        storeWithProductsNoneBought: new Store
            (<Store>{
                id: 'sanduches', name: 'Sanduches El Arbolito', address: ' Av. Eloy Alfaro N47-108, Quito, Ecuador',
                menu: [
                    new MenuItem(<MenuItem>{ id: 'steak', name: 'Steak', description: '...very nice...', price: '$12.99 CDN' }),
                    new MenuItem(<MenuItem>{ id: 'poutine', name: 'Poutine', description: '...quebec cheese curds...', price: '$7.99 CDN' }),
                ]
            })
            .replenish({ menuitem_id: 'steak', quantity: 10 }),

        storeWithProductsSomeBought: new Store
            (<Store>{
                id: 'shawarma', name: `Ottawa Shawarma Palace`, address: '2961 Carling Ave, Ottawa, Canada',
                menu: [
                    new MenuItem(<MenuItem>{ id: 'beans', name: 'Steak', description: '...wild west style...', price: '$2.99 CDN' }),
                ]
            })
            .replenish({ menuitem_id: 'beans', quantity: 4 }),

        purchase1: <Purchase>{
            id: 'purchase1',
            shopper_id: 'shopper1',
            store_id: 'shawarma',
            date: new Date('2021-05-10'),
            lineitems: [{
                store_id: 'shawarma',
                menuitem_id: 'beans',
                quantity: 1,
                notes: '',
                unit_price: '$2.99 CDN'
            }]
        },

        purchase2: <Purchase>{
            shopper_id: 'shopper2',
            store_id: 'sanduches',
            date: new Date('2021-05-10'),
            lineitems: [{
                store_id: 'sanduches',
                notes: '',
                menuitem_id: 'steak',
                quantity: 1,
                unit_price: '$39.00 CDN'
            }]
        },
    };

    /** User [4]*/
    // console.log('creating & signing in as admin ...')
    if (await app.authenticate(test_data.adminUser.email, '2021').catch(e => null)) {
        Object.assign(test_data.adminUser, app.authenticated.user);
    } else {
        const signedup = await app.signup(test_data.adminUser);
        await app.authenticate(test_data.adminUser.email, '2021');
    }

    // console.log('resetting dao...', app.authenticated);
    await app.reset();
    for (const user of [test_data.ownerUser, test_data.ownerUser2, test_data.shopperUserNoPurchases, test_data.shopperUserWithPurchase]) await app.signup(user);

    /** Store [3] */
    // console.log('creating stores...');
    (await app.authenticate(test_data.ownerUser.email, '2021')) && await Promise.all([test_data.storeNoProducts, test_data.storeWithProductsNoneBought].map(store => app.create(store)));
    (await app.authenticate(test_data.ownerUser2.email, '2021')) && await Promise.all([test_data.storeWithProductsSomeBought].map(store => app.create(store)));

    /** Purchases [1-saved + 1-unsaved] */
    // console.log('creating purchases...');
    await app.authenticate(test_data.shopperUserWithPurchase.email, '2021');
    app.store = test_data.storeWithProductsSomeBought;
    // console.log('/auth')
    await app.purchase(test_data.purchase1 = new Purchase(test_data.purchase1));
    // console.log('create purchase 2 - unsaved')
    test_data.purchase2 = new Purchase(test_data.purchase2);

    /** Shopping Cart [1] */
    // console.log('creating shopping cart items...')
    await app.addToCart(app.store.menu[0]);
    await app.addToCart(app.store.menu[0]);

    /** Log out */
    await app.authenticate('', '');

    // console.log('test data created')
    return test_data;
}

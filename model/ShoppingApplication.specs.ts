import md5 from 'md5';
import { MenuItem, Purchase, DAO, Store, User, UserCategory, ShoppingApplication } from './index';
import { expect } from 'chai';
import { ITEST_DATA, SETUP_TEST_DATA } from './test.data';
import { Util } from '../abstract/Util';

let _debugger = false;
export async function expectError(func: any, errorMessage?: string) {
    let error: any;
    let result: any
    try { result = <any>await func().then((result: any) => ({ result })); } catch (e) { error = e }
    // expect(result && JSON.stringify(result)).to.not.be.ok;
    // if (_debugger) { _debugger = false; debugger; }
    if (!error) console.log({ error, result });
    errorMessage
        ? expect(error?.message).to.equal(errorMessage)
        : expect(error?.message).to.be.ok;
}

export const RUN_SPECS = (app = new ShoppingApplication) => describe('Restaurant Review System : Business Model Application', () => {
    let test_data: ITEST_DATA;

    beforeEach(async () => { test_data = await SETUP_TEST_DATA(app); });

    describe('Standard-Feature: User Signup', () => {
        it('allows anyone to sign up as a reviewer', async () => {
            expect(await app.signup(new User(<User>{ name: 'test1', email: 'test1@test.com', Password: 'test', category: UserCategory.Shopper }))).to.be.ok;
        });
        it('allows anyone to sign up as a restaurateur', async () => {
            expect(await app.signup(new User(<User>{ name: 'test2', email: 'test2@test.com', Password: 'test', category: UserCategory.StoreOwner }))).to.be.ok;
        });
        it('validates email', async () => {
            _debugger = true;
            await expectError(() => app.signup(new User(<User>{ name: 'test2', email: 'test2test.com', Password: 'test', category: UserCategory.StoreOwner })), 'invalid-user-email');
        });
        it('validates password', async () => {
            await expectError(() => app.signup(new User(<User>{ name: 'test2', email: 'test2@test.com', category: UserCategory.StoreOwner })), 'invalid-user-password');
            await expectError(() => app.signup(new User(<User>{ Password: '', name: 'test2', email: 'test2@test.com', category: UserCategory.StoreOwner })), 'invalid-user-password');
        });
        it('validates name', async () => {
            await expectError(() => app.signup(new User(<User>{ email: 'test2@test.com', category: UserCategory.StoreOwner })), 'invalid-user-name');
            await expectError(() => app.signup(new User(<User>{ name: '', email: 'test2@test.com', category: UserCategory.StoreOwner })), 'invalid-user-name');
        });
    });

    describe('Standard-Feature: User Authentication', () => {
        it('authenticating provides an object containing a token and a user object', async () => {
            expect(await app.authenticate('alex+admin@hawryschuk.com', '2021')).to.be.ok;
        });
        it('fails to authenticate (and throws an error) when the user/password is invalid', async () => {
            await expectError(() => app.authenticate('alex+admin@hawryschuk.com', 'bad pass'), 'invalid password');
            await expectError(() => app.authenticate('no-such-user', 'bad pass'), 'unknown user');
        });
    });

    describe('Standard-Feature: Data security', () => {
        it('allows Users to retrieve their profile only', async () => {
            await app.authenticate(test_data.shopperUserWithPurchase.email, '2021');
            expect(await app.retrieve(test_data.shopperUserWithPurchase)).to.be.ok;
            await expectError(() => app.retrieve(test_data.ownerUser), 'get-self-profile');
        });
    });

    describe('Basic-Feature: Fetch All Stores', () => {
        it('has stores', async () => {
            await app.authenticate(test_data.ownerUser.email, '2021');
            expect(await app.Stores).to.have.length.greaterThan(0);
        });
        it('disallows unauthenticated users from fetching stores', async () => {
            await expectError(() => app.Stores, 'unauthenticated');
        });
    });

    describe('Basic-Feature: Fetch A Purchase', async () => {
        it('allows only the admins, the shopper, and seller to retrieve the purchase record', async () => {
            await app.authenticate(test_data.shopperUserWithPurchase.email, '2021');
            await app.retrieve(new Purchase(<any>{ id: test_data.purchase1.id }));
        });
        it('disallows non (admin,buyer,seller) from retrieving the purchase', async () => {
            await app.authenticate(test_data.shopperUserNoPurchases.email, '2021');
            await expectError(() => app.retrieve(new Purchase(<any>{ id: test_data.purchase1.id })), 'neither-shopper-seller-admin');
        });
    });

    describe('Admin-Feature: Fetch All Users', async () => {
        beforeEach(async () => await app.authenticate(test_data.adminUser.email, '2021'));
        it('has users', async () => {
            expect(await app.Users).to.have.length.greaterThan(0);
        });
        it('authorizes only Admin users to get the users', async () => {
            expect(await app.Users).to.be.ok;
            expect(await app.retrieve<User>('User')).to.be.ok;
            expect(await app.retrieve<User>(test_data.ownerUser)).to.be.ok;
        });
        it('disallows unauthenticated and unauthorized users from getting the list of users', async () => {
            await app.authenticate('', '');
            await expectError(() => app.retrieve<User>('User'), 'unauthenticated');
            await expectError(() => app.retrieve<User>(test_data.ownerUser), 'unauthenticated');

            await app.authenticate(test_data.ownerUser.email, '2021');
            await expectError(() => app.retrieve<User>('User'), 'admin-get-all-users');
            await expectError(() => app.retrieve<User>(test_data.shopperUserWithPurchase), 'get-self-profile');
        });
    });

    describe('Admin features', () => {
        it('allows only administrators to edit/remove users', async () => {
            await app.authenticate(test_data.adminUser.email, '2021');
            await app.update(test_data.shopperUserWithPurchase, <User>{ name: 'a new name' });
            await app.delete(test_data.shopperUserWithPurchase);
        });
        it('disallows non-admins from editing/removing other users (or its own user record)', async () => {
            await app.authenticate(test_data.shopperUserWithPurchase.email, '2021');
            await expectError(() => app.update(test_data.shopperUserWithPurchase, <User>{ name: 'a new name' }), 'unauthorized');
            await expectError(() => app.delete(test_data.shopperUserWithPurchase));
            await expectError(() => app.update(test_data.ownerUser, <User>{ name: 'a new name' }), 'unauthorized');
            await expectError(() => app.delete(test_data.ownerUser), 'admin-deletions-only');
        });
        it('prevents administrators from deleting themselves', async () => {
            await app.authenticate(test_data.adminUser.email, '2021');
            await expectError(() => app.delete(test_data.adminUser), 'no-self-deletions');
        });
        it('validates User name and email', async () => {
            await app.authenticate(test_data.adminUser.email, '2021');
            await expectError(() => app.update(test_data.shopperUserWithPurchase, <User>{ name: '' }), 'invalid: name');
            await expectError(() => app.update(test_data.shopperUserWithPurchase, <User>{ email: '' }), 'invalid: email');
            await expectError(() => app.update(test_data.shopperUserWithPurchase, <User>{ email: 'xxx' }), 'invalid: email');
        });
        it('allows administrators to edit/remove stores', async () => {
            await app.authenticate(test_data.adminUser.email, '2021');
            await app.update(test_data.storeWithProductsSomeBought, <Store>{ name: 'a new name' });
            await app.delete(test_data.storeWithProductsSomeBought);
        });
        it('validates Store name', async () => {
            await app.authenticate(test_data.adminUser.email, '2021');
            await expectError(() => app.update(test_data.storeWithProductsSomeBought, <Store>{ name: '' }), 'invalid: name');
        });
    });

    describe('Store', () => {
        it('validates its inventory by comparing purchases and restocking', async () => {
            await app.authenticate(test_data.adminUser.email, '2021');
            const store = test_data.storeWithProductsSomeBought;
            store.menu[0].inventory += 3;
            expect(await store.invalid()).to.equal('inventory');
        })
    });

    describe('Owner: Creating Stores', () => {
        it('allows only StoreOwners to create a restaurant', async () => {
            await app.authenticate(test_data.ownerUser.email, '2021');
            expect(await app.create(test_data.storeUnposted)).to.be.ok;
        });
        it('disallows non-StoreOwners to create a store', async () => {
            await app.authenticate(test_data.shopperUserWithPurchase.email, '2021');
            await expectError(() => app.create(test_data.storeUnposted), 'only store-owners may create stores')
        });
        it('validates name', async () => {
            await app.authenticate(test_data.ownerUser.email, '2021');
            await expectError(() => app.create(
                Object.assign(test_data.storeUnposted.clone(), { name: '' })
            ), 'invalid: name');
        })
    });

    describe('Owner: Updating Menu Items', () => {
        it('allows only StoreOwners to modify the menu', async () => {
            await app.authenticate(test_data.ownerUser.email, '2021');
            const [store] = await app.MyStores;
            const lengthBeforeAddingMenuItem = store.menu.length;
            await app.update(store, <Store>{
                menu: store.menu.concat(new MenuItem(<MenuItem>{
                    name: 'Corn on the cob',
                    description: 'locally grown corn',
                    price: '$1.00 CDN',
                    inventory: 0
                }))
            });
            expect(store.menu.length).to.equal(lengthBeforeAddingMenuItem + 1);
        });
        it('disallows non-store owners from modifying the menu', async () => {
            await app.authenticate(test_data.ownerUser.email, '2021');
            const mystores = await app.MyStores;
            const stores = await app.Stores;
            const notmystores = stores.filter(({ id }) => !Util.findWhere(mystores, { id }));
            await expectError(() => app.update(notmystores[0], { name: 'a new name' }));
        })
    });

    describe('Owner: Replenishing Inventory', async () => {
        it('replenishes inventory', async () => {
            await app.authenticate(test_data.ownerUser.email, '2021');
            app.store = test_data.storeWithProductsNoneBought;
            const inventoryBeforeRepleneshment = app.store.menu[0].inventory;
            await app.replenish({ menuitem_id: app.store.menu[0].id as string, quantity: 4 });
            expect(app.store.menu[0].inventory).to.equal(inventoryBeforeRepleneshment + 4);
            expect(await app.store.invalid()).to.equal('');
        });
        it('disallows non-owners from replenishing inventory', async () => {
            await app.authenticate(test_data.ownerUser.email, '2021');
            const mystores = await app.MyStores;
            const stores = await app.Stores;
            const notmystores = stores.filter(({ id }) => !Util.findWhere(mystores, { id }));
            app.store = <Store>(await notmystores).find(store => store.menu.length);
            await expectError(() => app.replenish({ menuitem_id: app.store.menu[0].id as string, quantity: 4 }), 'only-store-owner-can-replenish');
        })
    })

    describe('Shopper: Creating a purchase', () => {
        it('dis-allows shoppers from purchasing more than what is in inventoried', async () => {
            await app.authenticate(test_data.shopperUserNoPurchases.email, '2021');
            app.store = test_data.storeWithProductsNoneBought;
            expect(app.store.purchase_ids.length).to.equal(0);
            await expectError(() => app.purchase(new Purchase(<Purchase>{
                store_id: app.store.id,
                lineitems: [{
                    store_id: app.store.id,
                    menuitem_id: app.store.menu[0].id,
                    quantity: app.store.menu[0].inventory + 1,
                    notes: ''
                }],
            })), 'inventory-exceeded');
        });

        it('allows shoppers to make purchases', async () => {
            await app.authenticate(test_data.shopperUserNoPurchases.email, '2021');
            const userPurchasesBefore = app.user.purchase_ids.length;
            app.store = test_data.storeWithProductsNoneBought;
            expect(app.store.purchase_ids.length).to.equal(0);
            const store = await app.retrieve(new Store(<any>{ id: app.store.id }));
            await app.purchase(new Purchase(<Purchase>{
                store_id: app.store.id,
                lineitems: [{
                    store_id: app.store.id,
                    menuitem_id: app.store.menu[0].id,
                    quantity: 4,
                    notes: ''
                }],
            }));
            expect(app.store.purchase_ids.length).to.equal(1);
            expect(app.user.purchase_ids.length).to.equal(userPurchasesBefore + 1);
        });
    });

    describe('Shopper: Saving items in a shopping cart', () => {
        it('allows the user to add items to the cart, and save it in their profile', async () => {
            await app.authenticate(test_data.shopperUserNoPurchases.email, '2021');
            app.store = await app.retrieve(test_data.storeWithProductsNoneBought);
            await app.addToCart(app.store.menu[0]);
            app.store = await app.retrieve(test_data.storeWithProductsSomeBought);
            await app.addToCart(app.store.menu[0]);
            expect(app.user.cart.length).to.equal(2);

            await app.authenticate(test_data.shopperUserWithPurchase.email, '2021');
            expect(app.user.cart.length).to.equal(1);

            await app.authenticate(test_data.shopperUserNoPurchases.email, '2021');
            expect(app.user.cart.length).to.equal(2);
        })
    });

    describe('Owner: Completing a purchase', () => {
        it('only allows the seller to complete the purchase', async () => {
            await app.authenticate(test_data.ownerUser2.email, '2021');
            const [purchase] = await (await app.retrieve(test_data.storeWithProductsSomeBought)).purchases;
            await app.complete(purchase);
            await app.authenticate(test_data.ownerUser.email, '2021');
            await expectError(() => app.complete(purchase));
        });
    });

    describe('Shopper: Viewing Purchases', () => {
        it('only allows the shopper to see all their purchases', async () => {
            await app.authenticate(test_data.shopperUserWithPurchase.email, '2021');
            const purchases = await app.user.purchases;
            expect(purchases.length).to.equal(1);
        });
    });
});

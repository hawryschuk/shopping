import { browser, by, element, logging } from 'protractor';
import { UserCategory, Util } from '../../../model';

const WebClient = {
    Login: async (category: UserCategory) => {
        await element(by.css('input[name=email]')).clear();
        await element(by.css('input[name=email]')).sendKeys({
            [UserCategory.Admin]: 'alex+admin@hawryschuk.com',
            [UserCategory.Shopper]: 'alex+regular1@hawryschuk.com',
            [UserCategory.StoreOwner]: 'alex+owner@hawryschuk.com',
        }[category]);
        await element(by.css('input[name=Password]')).clear();
        await element(by.css('input[name=Password]')).sendKeys('2021');
        await element(by.buttonText('Log In')).click();
    },
    ViewSignUpForm: async () => await element(by.linkText('Sign Up')).click(),
    ViewStore: async (n = 0) => {
        await element.all(by.css('.datagrid-cell > button')).get(n).click();
        expect(await element(by.css('app-store')).isPresent());
    }
}

export class FeatureStep {
    constructor(data: FeatureStep) { Object.assign(this, data) }
    accept: boolean; // auto-accept changes
    subtitle: string;
    code: Function;
    changed!: boolean;
    get Feature() { return Features.find(f => f.steps.includes(this)) }
    get Filename() { return `${this.Feature.FilenamePrefix}.${this.Feature.steps.indexOf(this)}.png` }
    get ignored() { return (this.Feature.ignored || []).filter(item => !item.steps?.length || item.steps.includes(this.Feature.steps.indexOf(this))) }
}

export class Feature {
    constructor(data: Feature) { Object.assign(this, data, { steps: data.steps.map(s => new FeatureStep(s as any)) }) }
    accept: boolean; // auto-accept changes
    title: string;
    description: string;
    focus: boolean;
    steps: FeatureStep[];
    filenamePrefix;
    ignored?: { x: number; y: number; width: number; height: number; steps?: number[] }[];
    get FilenamePrefix() { return this.filenamePrefix || `${1 + Features.indexOf(this)}`; }
}

export const Features = [
    //#region Standard
    {
        category: 'Standard',
        title: 'Landing Page',
        description: 'As a user not logged in, they need to see the landing page with high-level details about the project (name,description)',
        focus: false,
        steps: [
            {
                subtitle: 'Open the website - We are not logged in, and are given the login form',
                code: async () => { expect(await element(by.css('app-login')).isPresent()).toBeTrue(); }
            },
        ]
    },

    {
        category: 'Standard',
        title: 'Sign-Up',
        description: 'Starting from the "Landing" page, click on the "Sign Up" menu link',
        focus: false,
        steps: [
            {
                subtitle: 'From the landing page, click on the sign up button',
                code: async () => await WebClient.ViewSignUpForm()
            },
        ]
    },

    {
        category: 'Standard',
        title: 'Sign Up as a Shopper',
        focus: false,
        filenamePrefix: 'SignUpAsShopper',
        description: 'As a user not logged in, there shall be functionality to sign up as a Shopper',
        steps: [
            {
                subtitle: 'Starting from the "Sign Up" page, fill in your email,',
                code: async () => {
                    await WebClient.ViewSignUpForm()
                    await element(by.css('input[name=email]')).clear();
                    await element(by.css('input[name=email]')).sendKeys('alex+new222@hawryschuk.com');
                },
            },
            {
                subtitle: '...your name,',
                code: async () => {
                    await element(by.css('input[name=name]')).clear();
                    await element(by.css('input[name=name]')).sendKeys('alex new 222');
                }
            },
            {
                subtitle: '...and password.',
                code: async () => {
                    await element(by.css('input[name=Password]')).clear();
                    await element(by.css('input[name=Password]')).sendKeys('2022');
                }
            },
            {
                subtitle: 'To finish, clicking on "Sign Up" will have you signed up, and signed in.',
                code: async () => { await element(by.buttonText('Sign Up')).click(); }
            },
        ]
    },

    {
        category: 'Standard',
        title: 'Log In as a Shopper',
        filenamePrefix: 'LoginAsShopper',
        description: '',
        focus: false,
        steps: [
            {
                subtitle: 'Starting from the "Log In" page, fill in your email address....',
                code: async () => {
                    await element(by.css('input[name=email]')).clear();
                    await element(by.css('input[name=email]')).sendKeys('alex+regular1@hawryschuk.com');
                }
            },
            {
                subtitle: '...your password,',
                code: async () => {
                    await element(by.css('input[name=Password]')).clear();
                    await element(by.css('input[name=Password]')).sendKeys('2021');
                }
            },
            {
                subtitle: '...and after clicking on the "Login" button, you will be logged into the home page',
                code: async () => {
                    await element(by.buttonText('Log In')).click();
                }
            },
        ]
    },
    //#endregion

    //#region all_users
    {
        category: 'AllUsers',
        title: 'View Stores',
        description: 'As a signed in regular user, I will see the list of stores',
        filenamePrefix: 'ViewStores',
        focus: false,
        steps: [
            {
                subtitle: '',
                code: async () => { await WebClient.Login(UserCategory.Shopper); }
            }
        ]
    },

    {
        category: 'AllUsers',
        title: 'View Store Details',
        filenamePrefix: 'ViewStore',
        description: 'The "Store Details" includes the name, number of menu items, and a list of menu-items',
        focus: false,
        steps: [
            {
                subtitle: `Starting from the "stores" page,`,
                code: async () => { await WebClient.Login(UserCategory.Shopper); },
            },
            {
                subtitle: `...click on the row of the store and to view the "store details" (the menu items)`,
                code: async () => await WebClient.ViewStore(2)
            },
            {
                subtitle: 'Note: When a store has no menu items, you may see the indication',
                code: async () => await WebClient.ViewStore(1)
            }
        ]
    },
    //#endregion

    /** User::StoreOwner */
    {
        category: 'StoreOwner',
        title: 'Add A Store',
        description: 'As a Store Owner, I am able to manage the list of stores I have, and can add another store',
        filenamePrefix: 'AddStore',
        steps: [
            {
                subtitle: 'Having signed in, and seeing the list of "My Stores",',
                code: async () => { await WebClient.Login(UserCategory.StoreOwner); },
            },
            {
                subtitle: '...click on "Add Store"',
                code: async () => { await element(by.buttonText('Add Store')).click(); }
            },
            {
                subtitle: '...and then fill in the name,',
                code: async () => await element(by.css('input[name=name]')).sendKeys('a new business!'),
            },
            {
                subtitle: '...and then the address,',
                code: async () => await element(by.css('input[name=address]')).sendKeys('100 huntley street'),
            },
            {
                subtitle: '...and finish by clicking on "Save"',
                code: async () => { await element(by.buttonText('Save')).click(); }
            },
        ]
    },
    {
        category: 'StoreOwner',
        title: 'Add A New Menu Item',
        description: 'As a Store Owner, I am able to manage the list of menu items for each store (crud:name,price)',
        filenamePrefix: 'AddMenuItem',
        focus: false,
        steps: [
            {
                subtitle: 'Having signed in, and seeing the list of "My Stores",',
                code: async () => {
                    await WebClient.Login(UserCategory.StoreOwner);
                    await WebClient.ViewStore(0);
                },
            },
            {
                subtitle: '...click on the "Add Menu Item" button,',
                code: async () => {
                    await element(by.buttonText('New MenuItem')).click();
                }
            },
            {
                subtitle: '...fill in the name,',
                code: async () => {
                    await element(by.css('input[name=name]')).sendKeys('cheeseburger');
                }
            },
            {
                subtitle: '...the price,',
                code: async () => {
                    await element(by.css('input[name=price]')).sendKeys('$8.99 CDN');
                }
            },
            {
                subtitle: '...the description,',
                code: async () => {
                    await element(by.css('textarea[name=description]')).sendKeys('queen-sized cheeseburger ruben and blt style');
                }
            },
            {
                subtitle: '...the amount of inventory (optional),',
                code: async () => {
                    await element(by.css('input[name=inventory]')).clear();
                    await element(by.css('input[name=inventory]')).sendKeys('12');
                }
            },
            {
                subtitle: '...and finally finish by clicking on the "Add" button',
                code: async () => {
                    await element(by.buttonText('Add')).click();
                }
            },
        ]
    },
    {
        category: 'StoreOwner',
        title: 'Delete a Menu Item',
        description: 'As a Store Owner, I can delete menu items',
        filenamePrefix: 'AddMenuItem',
        steps: [
            {
                subtitle: 'Having signed in, and seeing the list of "My Stores", click on the menu item, ',
                code: async () => {
                    await WebClient.Login(UserCategory.StoreOwner);
                    await element(by.css('clr-dg-action-overflow button')).click();
                }
            },
            {
                subtitle: '...and then the "Delete Menu Item" button (from the dropdown that appeared).',
                code: async () => {
                    await element(by.buttonText('Delete Menu Item')).click();
                }
            }
        ]
    },
    {
        category: 'StoreOwner',
        title: 'Edit a Menu Item / Replenish product inventory',
        description: `As a Store Owner, I can update the inventory/menuitem details`,
        filenamePrefix: 'EditMenuItem',
        steps: [
            {
                subtitle: 'Having signed in, and seeing the list of "My Stores", click on the menu item, ',
                code: async () => {
                    await WebClient.Login(UserCategory.StoreOwner);
                    await element(by.css('clr-dg-action-overflow button')).click();
                }
            },
            {
                subtitle: '...and then the "Edit Menu Item" button (from the dropdown that appeared).',
                code: async () => {
                    await element(by.buttonText('Edit MenuItem')).click();
                }
            },
            {
                subtitle: 'Update the description',
                code: async () => await element(by.css('input[name=description]')).sendKeys('...a better description')
            },
            {
                subtitle: 'And the new inventory adjustment',
                code: async () => {
                    await element(by.css('input[name=inventory]')).clear();
                    await element(by.css('input[name=inventory]')).sendKeys('400');
                }
            },
            {
                subtitle: '...and finish by clicking on the "Save" button',
                code: async () => {
                    await element(by.buttonText('Save')).click();
                }
            },
        ]
    },

    /** User::Shopper */
    {
        category: 'Shopper',
        title: 'View My Purchases',
        filenamePrefix: 'ViewMyPurchases',
        focus: false,
        description: `As a shopper, I am interested in seeing the past purchases I've made, and the progress of my recent purchases.`,
        steps: [
        ]
    },

    {
        category: 'Shopper',
        title: 'Error Detection: Add Items to Cart',
        filenamePrefix: 'AddToShoppingCartErrors',
        focus: false,
        description: 'As a regular user, you can add store menu items to your shopping cart',
        steps: [
            {
                subtitle: `Starting from the "Store Details View" screen, and attempting to add the second menu item ( with no inventory left ),`,
                code: async () => {
                    await WebClient.Login(UserCategory.Shopper);
                    await WebClient.ViewStore(1);
                    await element.all(by.css('clr-dg-action-overflow button')).get(1).click();
                }
            },
            {
                subtitle: '...having clicked on "Add to Cart" we will be alerted of the inability',
                code: async () => {
                    await element(by.buttonText('Add to Cart')).click();
                }
            },
        ]
    },

    {
        category: 'Shopper',
        title: 'Add Items to Cart',
        filenamePrefix: 'AddToShoppingCart',
        focus: false,
        description: 'As a regular user, you can add store menu items to your shopping cart',
        steps: [
            {
                subtitle: `Starting from the "Store Details View" screen,`,
                code: async () => {
                    await WebClient.Login(UserCategory.Shopper);
                    await WebClient.ViewStore(1)
                }
            },
            {
                subtitle: '...click on the dropdown button (ellipses symbol) on the left side of the user row,',
                code: async () => { await element.all(by.css('clr-dg-action-overflow button')).get(0).click(); }
            },
            {
                subtitle: `...and then click on "Add To Cart". Your shopping cart now has one item.`,
                code: async () => { await element(by.buttonText('Add to Cart')).click(); }
            },
        ]
    },
    {
        category: 'Shopper',
        title: 'View My Cart',
        filenamePrefix: 'ViewMyCart',
        focus: false,
        description: `As a regular user, having items in the cart, you may view the "My Cart" page to see the total cost and check out`,
        steps: [
            {
                subtitle: `Starting from the "Store Details View" screen,`,
                code: async () => {
                    await WebClient.Login(UserCategory.Shopper);
                    await WebClient.ViewStore(1)
                }
            },
            {
                subtitle: `You may view your shopping cart by clicking on the "My Cart" link,`,
                code: async () => { await element(by.buttonText('My Cart')).click(); }
            },
            {
                subtitle: `...and you may checkout by clicking on the "Check Out" button`,
                code: async () => { await element(by.buttonText('Check Out')).click(); }
            },
        ]
    },
    {
        category: 'Shopper',
        title: 'Purchase items in "My Cart" (Checkout)',
        filenamePrefix: 'CheckoutMyCart',
        focus: false,
        description: `As a regular user, having items in the cart, you may check-out the items and create a purchase`,
        steps: [
            {
                subtitle: `Starting from the "My Cart Page" screen,`,
                code: async () => {
                    await WebClient.Login(UserCategory.Shopper);
                    await WebClient.ViewStore(1)
                    await element(by.buttonText('My Cart')).click();
                }
            },
            {
                subtitle: `...and you may checkout by clicking on the "Check Out" button`,
                code: async () => { await element(by.buttonText('Check Out')).click(); }
            },
        ]
    },


    //#region User::Admin
    {
        category: 'Admin',
        title: 'Delete a User',
        description: 'As an administrator user, I can delete users',
        filenamePrefix: 'DeleteUser',
        focus: false,
        steps: [
            {
                subtitle: 'Starting from the "Users" page,',
                code: async () => { await WebClient.Login(UserCategory.Admin); await element(by.linkText('Users')).click(); }
            },
            {
                subtitle: '...click on the dropdown button (ellipses symbol) on the left side of the user row,',
                code: async () => { await element.all(by.css('clr-dg-action-overflow button')).get(1).click(); }
            },
            {
                subtitle: '...and finally click on the "Delete User" button to delete the user.',
                code: async () => await element(by.buttonText('Delete User')).click()
            },
        ],
    },
    {
        category: 'Admin',
        title: 'Edit a User',
        description: 'As an administrator user, I can edit users',
        filenamePrefix: 'EditUser',
        focus: false,
        accept: false,
        steps: [
            {
                subtitle: 'Starting from the "Users" page,',
                code: async () => {
                    await WebClient.Login(UserCategory.Admin);
                    await element(by.linkText('Users')).click();
                    await Util.pause(700);
                }
            },
            {
                subtitle: '...click on the dropdown button (ellipses symbol) on the left side of the user row,',
                code: async () => { await element.all(by.css('clr-dg-action-overflow button')).get(2).click(); }
            },
            {
                subtitle: '...and then click on the "Edit User" button,',
                code: async () => await element(by.buttonText('Edit User')).click()
            },
            {
                subtitle: '...and then proceed to enter in your changes,',
                code: async () => {
                    await element(by.css('input[name=name]')).clear();
                    await element(by.css('input[name=name]')).sendKeys('a new name');
                }
            },
            {
                subtitle: '...and finally, click on the "Save" button.',
                code: async () => {
                    await element(by.buttonText('Save')).click();
                    await Util.pause(333);
                }
            },
        ],
    },
    {
        category: 'Admin',
        title: 'Delete a Store',
        description: 'As an administrator user, I can delete stores',
        filenamePrefix: 'DeleteStore',
        focus: false,
        steps: [
            {
                subtitle: 'Having signed in as an admin user, I can see a list of stores',
                code: async () => await WebClient.Login(UserCategory.Admin)
            },
            {
                subtitle: 'Click on the "view" button for the store you wish to remove',
                code: async () => await WebClient.ViewStore()
            },
            {
                subtitle: 'Click on the "delete" button',
                code: async () => await element(by.buttonText('Delete Store')).click()
            },
        ],
    },
    {
        category: 'Admin',
        title: 'Edit a Store',
        description: 'As an administrator user, I can edit stores',
        filenamePrefix: 'EditStore',
        focus: false,
        steps: [
            {
                subtitle: 'Having signed in as an admin user, I can see a list of stores',
                code: async () => await WebClient.Login(UserCategory.Admin)
            },
            {
                subtitle: 'Click on the "view" button for the store you wish to edit',
                code: async () => await WebClient.ViewStore()
            },
            {
                subtitle: 'Click on the "Edit Store" button',
                code: async () => { await element(by.buttonText('Edit Store')).click(); },
            },
            {
                subtitle: 'Make changes, such as typing a new name',
                code: async () => {
                    await element(by.css('input[name=name]')).clear();
                    await element(by.css('input[name=name]')).sendKeys('a new name');
                }
            },
            {
                subtitle: 'Click on the save button',
                code: async () => await element(by.buttonText('Save')).click()
            },
        ],
    },
    //#endregion
    //#region Error Detection
    /** User::Visitor */
    {
        category: 'Standard',
        title: 'Error Detection: Log In',
        description: 'The username must exist, and the password must be correct',
        filenamePrefix: 'LogInErrors',
        focus: false,
        steps: [
            {
                subtitle: 'login-unknown-user',
                code: async () => {
                    await element(by.css('input[name=Password]')).sendKeys('xxxxx');
                    await element(by.css('input[name=email]')).sendKeys('unknown@user.com');
                    await element(by.buttonText('Log In')).click();
                    await Util.pause(333);
                }
            },
            {
                subtitle: 'login-invalid-password',
                code: async () => {
                    await element(by.css('input[name=email]')).clear();
                    await element(by.css('input[name=email]')).sendKeys('alex@hawryschuk.com');
                    await element(by.buttonText('Log In')).click();
                    await Util.pause(333);
                }
            },

        ]
    },
    {
        category: 'Standard',
        title: 'Error Detection: Sign up',
        description: 'The email must be valid, not already signed up, have a name, and a password.',
        filenamePrefix: 'SignUpErrors',
        focus: false,
        accept: false,
        steps: [
            {
                subtitle: 'signup-user-exists',
                code: async () => {
                    await WebClient.ViewSignUpForm()
                    await element(by.css('input[name=name]')).sendKeys('abc');
                    await element(by.css('input[name=email]')).sendKeys('alex@hawryschuk.com');
                    await element(by.css('input[name=Password]')).sendKeys('xxx');
                    await element(by.buttonText('Sign Up')).click();
                    await Util.pause(333);
                }
            },
            {
                subtitle: 'signup-invalid-email',
                code: async () => {
                    await element(by.css('input[name=email]')).clear();
                    await element(by.css('input[name=email]')).sendKeys('bad-email');
                    await element(by.buttonText('Sign Up')).click();
                    await Util.pause(333);
                }
            },
            {
                subtitle: 'signup-invalid-name',
                code: async () => {
                    await element(by.css('input[name=name]')).clear();
                    await element(by.css('input[name=name]')).sendKeys(' \b');

                    await element(by.css('input[name=email]')).clear();
                    await element(by.css('input[name=email]')).sendKeys('alex+new@hawryschuk.com');
                    await element(by.buttonText('Sign Up')).click();
                    await Util.pause(333);
                }
            },

            {
                subtitle: 'signup-invalid-password',
                code: async () => {
                    console.log('trying an invalid password...')
                    await element(by.css('input[name=Password]')).clear();
                    await element(by.css('input[name=Password]')).sendKeys(' \b');
                    await element(by.css('input[name=name]')).sendKeys('my name');
                    await element(by.buttonText('Sign Up')).click();
                    await Util.pause(333);
                }
            },
        ]
    },
    /** User::StoreOwner */
    {
        title: 'Error Detection: Create a store',
        filenamePrefix: 'CreateStoreErrors',
        description: 'Stores must have a name',
        accept: false,
        focus: false,
        steps: [
            {
                subtitle: 'Starting from after clicking on the "Create Store" button,',
                code: async () => {
                    await WebClient.Login(UserCategory.StoreOwner);
                    await element(by.buttonText('Add Store')).click();
                    await element(by.css('input[name=name]')).clear();
                    await element(by.css('input[name=name]')).sendKeys(' \b');
                }
            },
            {
                subtitle: 'Without filling in the store name, and submitting...',
                code: async () => { await element(by.buttonText('Add')).click(); }
            },
        ]
    },
    /** User::Shopper */

    /** User::Admin */
    {
        title: 'Error Detection: Delete a User',
        description: 'The administrator cannot delete his own user account',
        filenamePrefix: 'DeleteUserErrors',
        focus: false,
        steps: [
            {
                subtitle: 'Starting from the "Users" page, try to delete your account...',
                code: async () => {
                    await WebClient.Login(UserCategory.Admin); await element(by.linkText('Users')).click();
                    await element.all(by.css('clr-dg-action-overflow button')).get(0).click();
                    await element(by.buttonText('Delete User')).click();
                    await Util.pause(650);
                },
            }
        ],
    },
    {
        title: 'Error Detection: Edit a User',
        description: 'A User must have a name',
        filenamePrefix: 'EditUserErrors',
        focus: false,
        accept: false,
        ignored: [
            {   // the user creation date
                steps: [0, 1],
                x: 430,
                y: 290,
                width: 425,
                height: 45
            }
        ],
        steps: [
            {
                subtitle: 'Starting from the "Users" page, having clicked opened the "Edit User" dialog,',
                code: async () => {
                    await WebClient.Login(UserCategory.Admin);
                    await element(by.linkText('Users')).click();
                    await element(by.css('clr-dg-action-overflow button')).click();
                    await element(by.buttonText('Edit User')).click();
                    await element(by.css('input[name=name]')).clear();
                    await element(by.css('input[name=name]')).sendKeys(' \b');
                    await Util.pause(333);
                }
            },
            {
                subtitle: '...and pressing save.',
                code: async () => {
                    await element(by.buttonText('Save')).click();
                    await Util.pause(333);
                },
            }
        ],
    },
    {
        title: 'Error Detection: Edit Store',
        description: 'A store is required to have a name',
        filenamePrefix: 'EditStoreErrors',
        focus: false,
        steps: [
            {
                subtitle: 'Starting from the "Edit Store" dialog,',
                code: async () => {
                    await WebClient.Login(UserCategory.Admin)
                    await WebClient.ViewStore()
                    await element(by.buttonText('Edit Store')).click();
                    await element(by.css('input[name=name]')).clear();
                    await element(by.css('input[name=name]')).sendKeys(' \b'); // form validation will turn it red
                },
            },
            {
                subtitle: '...once you click save, an alert will display.',
                code: async () => {
                    await element(by.buttonText('Save')).click();
                    await Util.pause(333);
                }
            }
        ]
    },

    //#endregion

].map(f => new Feature(f as any));

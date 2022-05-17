import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { combineLatest, BehaviorSubject, Observable, from } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, publishReplay, reduce, refCount, startWith, switchMap, take, tap } from 'rxjs/operators';
import { Store, UserCategory, User, ShoppingApplication, Util, Purchase, MenuItem } from '../../../model';
import { SETUP_TEST_DATA } from '../../../model/test.data';
import { ShoppingApplicationOverRestApi } from '../../../server/ShoppingApplicationOverRestApi';
import { PurchaseLineItem } from '../../../model/PurchaseLineItem';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  constructor(
    public router: Router,
    public http: HttpClient
  ) { }

  errors$ = new BehaviorSubject<Error[]>([]);

  loading = new class {
    tasks = 0;
    start(task?: string) { this.tasks++; }
    finish(task?: string) { this.tasks--; }
  }
  FeatureFlags = new class {
    get debug() { return localStorage.getItem('feat.debug'); }          // for realtime development
    set debug(v) { localStorage.setItem('feat.debug', !!v ? v : ''); }  // for realtime development

    get autologin() { return localStorage.getItem('feat.autologin'); }  // for realtime development
    set autologin(email: string) { localStorage.setItem('feat.autologin', email); }

    get resetdata() { return localStorage.getItem('feat.resetdata'); }    // for realtime development
    set resetdata(v) { localStorage.setItem('feat.resetdata', v); }    // for realtime development

    get apiserver() { return localStorage.getItem('feat.apiserver'); }    // for realtime development
    set apiserver(v) { localStorage.setItem('feat.apiserver', v); }    // for realtime development
  }

  /** API_SERVER_BASE_URL */
  get baseURL() { return this.FeatureFlags.apiserver || window.location.port == '4202' && 'http://localhost:8002' || ''; }
  get debugging() { return !(this.app instanceof ShoppingApplicationOverRestApi) || /^42|8002/.test(window.location.port) }

  /** Preload the database with default data */
  setup = async (resetToTestData = this.FeatureFlags.resetdata || this.debugging) => {
    if (resetToTestData) await SETUP_TEST_DATA(this.app);
    if (this.FeatureFlags.autologin) this.credentials = { email: this.FeatureFlags.autologin, Password: '2021' };
  }

  httpClientAdapter = async ({
    method = 'get' as 'get' | 'post' | 'put' | 'delete',
    url = '' as string,
    body = null as any,
    responseType = 'json' as 'arraybuffer' | 'blob' | 'text' | 'json',
    headers = {} as { [header: string]: string | string[]; }
  }) => {
    this.loading.start();
    return this
      .http.request(
        method.toUpperCase(),
        `${this.baseURL}/${url}`,
        {
          headers: { 'authorization': this.app.authenticated?.token || '', ...headers },
          body,
          responseType
        }
      )
      .pipe(tap(() => this.loading.finish()), catchError(async error => { this.loading.finish(); throw error; }))
      .pipe(catchError(async error => {
        if (error.message.endsWith('0 Unknown Error')) throw new Error('Server Error (might be down)');
        throw new Error(typeof error.error === 'string' ? error.error : error.error?.error || error.message || error);
      }))
      .pipe(take(1)).toPromise();
  }

  app: ShoppingApplication = this.baseURL || /^80/.test(window.location.port)
    ? new ShoppingApplicationOverRestApi(this.httpClientAdapter)
    : new ShoppingApplication();

  ready = Util.pause(1)
    .then(() => Object.assign(window, { app: this.app, api: this }))
    .then(() => this.setup());

  refresh$ = new BehaviorSubject(new Date);

  //#region Sign In
  email = '';
  Password = '';
  set credentials({ email, Password }) { this.credentials$.next({ email, Password }) }
  credentials$ = new BehaviorSubject({ email: '', Password: '' });

  authenticated$: Observable<{ email: string; Password: string; token: string; error: string; user: User }> =
    from(this.ready)
      .pipe(switchMap(() => this.credentials$))
      .pipe(switchMap(async ({ email, Password }) => email && <any>await this
        .app.authenticate(email, Password)
        .then(() => this.app.authenticated)
        .catch(error => ({ error: error.message || error.error || error }))
        .then(result => Object.assign(result, { email, Password }))
      ),
        startWith({})
      )
      .pipe(publishReplay(1), refCount())

  token$ = this
    .authenticated$
    .pipe(map(t => t.token))

  async login({ email = this.email, Password = this.Password } = {}) {
    this.credentials = { email, Password };
    await this
      .authenticated$
      .pipe(filter(a => a.email === this.email && a.Password === this.Password))
      .pipe(take(1))
      .toPromise();
    if (await this.token$.pipe(take(1)).toPromise()) {
      await this.router.navigateByUrl('/');
    }
  }

  logout() {
    this.credentials = { email: '', Password: '' };
    this.router.navigateByUrl('/login');
  }

  async signup(user: User) {
    await this.app.signup(new User(user));
    Object.assign(this, { email: user.email, Password: user.Password });
    await this.login();
  }

  //#endregion

  //#region User
  User$ = this.authenticated$
    .pipe(map(auth => auth.user))
    .pipe(tap(user => Util.pause(1).then(() => this.router.navigateByUrl('/'))))
    .pipe(tap(user => (user && this.FeatureFlags.autologin && (this.FeatureFlags.autologin = user.email))))
    .pipe(publishReplay(1), refCount());

  UserIsShopper$ = this.User$.pipe(map(u => u?.category === UserCategory.Shopper))
  UserIsAdmin$ = this.User$.pipe(map(u => u?.category === UserCategory.Admin))
  UserIsStoreOwner$ = this.User$.pipe(map(u => u?.category === UserCategory.StoreOwner))

  Users$ = this.User$
    .pipe(switchMap(async user => user?.category === UserCategory.Admin && <User[]>await this.app.Users))
    .pipe(publishReplay(1), refCount())

  // get user() { return this.User$.pipe(take(1)).toPromise() }
  // userIsAdmin$ = this.User$.pipe(map(user => user && user.category === UserCategory.Admin));
  //#endregion

  //#region Store
  _AllStores$ = this
    .User$
    .pipe(filter(user => !!user), take(1))
    .pipe(switchMap(() => this.app.Stores))
    .pipe(publishReplay(1), refCount());

  AllStores$ = this.refresh$.pipe(switchMap(() => this._AllStores$));

  Stores$ = this.User$
    .pipe(switchMap(user => (user?.category === UserCategory.StoreOwner ? this.MyStores$ : this.AllStores$)))
    .pipe(publishReplay(1), refCount());
  //#endregion

  //#region User::StoreOwner
  MyStores$ = combineLatest([this.User$, this.AllStores$])
    .pipe(switchMap(async ([user, stores]) => stores.filter(r => user && r.ownedBy(user))))
    .pipe(publishReplay(1), refCount())

  PurchasesPendingCompletion$ = this
    .MyStores$
    .pipe(switchMap(async (stores) => {
      const purchasesForStores = await Promise.all(stores.map(store => store.purchasesPendingCompletion));
      return stores.reduce(
        (pending, store, index) => pending.concat(purchasesForStores[index].map(purchase => ({ store, purchase }))),
        [] as { store: Store, purchase: Purchase }[]
      )
    }))
    .pipe(distinctUntilChanged((prev, cur) => prev.length === cur.length))
    .pipe(publishReplay(1), refCount());

  async createStore(store: Store) {
    const stores = await this._AllStores$.pipe(take(1)).toPromise();
    await this.app.create(store);
    if (!stores.includes(store)) stores.push(store);
    this.refresh$.next(new Date);
  }

  async completePurchase(purchase: Purchase) {

  }

  async deleteMenuitem(menuitem: MenuItem) { }

  //#endregion

  //#region User::Admin
  async deleteStore(store = this.app.store) {
    const stores = await this.Stores$.pipe(take(1)).toPromise();
    await this.app.delete(store);
    Util.removeElements(stores, store);
  }

  async deleteUser(user: User) {
    const users = await this.Users$.pipe(take(1)).toPromise();
    await this.app.delete(user);
    Util.removeElements(users, user);
  }
  //#endregion
}

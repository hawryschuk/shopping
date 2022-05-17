import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './admin.guard';
import { AuthGuard } from './auth.guard';
import { DebugComponent } from './debug/debug.component';
import { DocsComponent } from './docs/docs.component';
import { LoginComponent } from './login/login.component';
import { StoresComponent } from './stores/stores.component';
import { StoreOwnerGuard } from './store.owner.guard';
import { SignupComponent } from './signup/signup.component';
import { UsersComponent } from './users/users.component';
import { CartComponent } from './cart/cart.component';
import { PurchasesComponent } from './purchases/purchases.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'purchases', component: PurchasesComponent, canActivate: [AuthGuard] },
  { path: 'cart', component: CartComponent, canActivate: [AuthGuard] },
  { path: 'stores', component: StoresComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersComponent, canActivate: [AdminGuard] },
  { path: 'docs', component: DocsComponent },
  { path: 'debug', component: DebugComponent },
  { path: '', redirectTo: '/stores', pathMatch: 'full' },
  { path: '**', redirectTo: '/stores' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }

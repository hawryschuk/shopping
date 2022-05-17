import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ApplicationService } from './application.service';

@Injectable({
  providedIn: 'root'
})
export class StoreOwnerGuard implements CanActivate {
  constructor(public api: ApplicationService, public router: Router) { }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    if (await this.api.UserIsStoreOwner$.pipe(take(1)).toPromise()) {
      return true;
    } else {
      this.router.navigate(['/']);
      return false;
    }
  }

}

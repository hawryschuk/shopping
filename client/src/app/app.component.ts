import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApplicationService } from './application.service';
import '@cds/core/alert/register.js';
import '@cds/core/icon/register.js';
import { ClarityIcons, noteIcon, plusIcon, worldIcon, trashIcon } from '@cds/core/icon';
import { Util } from '../../../model';
import { debounceTime, reduce, tap } from 'rxjs/operators';

ClarityIcons.addIcons(worldIcon);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  constructor(
    public api: ApplicationService,
    public router: Router,
    public cd: ChangeDetectorRef
  ) {
    api.errors$.pipe(debounceTime(200)).subscribe(() => {
      cd.markForCheck();
      cd.detectChanges();
    })
  }

}

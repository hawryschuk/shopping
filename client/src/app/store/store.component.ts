import { Component, Input, OnInit } from '@angular/core';
import { MenuItem, Store } from '../../../../model';
import { ApplicationService } from '../application.service';

import { ClarityIcons, starIcon, halfStarIcon } from '@cds/core/icon';
ClarityIcons.addIcons(starIcon, halfStarIcon);

@Component({
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.sass']
})
export class StoreComponent {
  constructor(public api: ApplicationService) { }
  @Input() store: Store = this.api.app.store;
  generateMenuItem = () => new MenuItem(<MenuItem>{ price: '', inventory: 0, name: '' });
}

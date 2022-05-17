import { Component, OnInit } from '@angular/core';
import { Store } from '../../../../model';
import { ApplicationService } from '../application.service';
import { ClarityIcons, trashIcon, noteIcon, plusIcon, pencilIcon } from '@cds/core/icon';
ClarityIcons.addIcons(trashIcon, noteIcon, plusIcon, pencilIcon);

@Component({
  selector: 'app-stores',
  templateUrl: './stores.component.html',
  styleUrls: ['./stores.component.sass']
})
export class StoresComponent implements OnInit {
  constructor(public api: ApplicationService) { }
  ngOnInit(): void { }
  generateStore = () => new Store;
}

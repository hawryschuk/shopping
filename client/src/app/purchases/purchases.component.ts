import { Component, OnInit } from '@angular/core';
import { ApplicationService } from '../application.service';
@Component({
  selector: 'app-purchases',
  templateUrl: './purchases.component.html',
  styleUrls: ['./purchases.component.sass']
})
export class PurchasesComponent implements OnInit {
  constructor(public api: ApplicationService) { }
  ngOnInit(): void { }
  purchases$ = this.api.app.user
    .purchases
    .then(purchases => Promise.all(purchases
      .map(async ({ date, Store, totalCost }) => {
        return ({
          date: date.toLocaleDateString(),
          Store: await Store,
          totalCost
        })
      })
    ))
}

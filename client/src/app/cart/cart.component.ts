import { Component, OnInit } from '@angular/core';
import { Util } from '../../../../model';
import { ApplicationService } from '../application.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.sass']
})
export class CartComponent implements OnInit {
  constructor(public api: ApplicationService) { }
  ngOnInit(): void { }
  prompt = prompt;
  async removeItemFromCart(item: any) {
    const cart = await this.cart;
    Util.removeElements(cart, item);
    this.api.app.removeItemFromCart(item.record);
  }
  cart = Promise.all(this.api.app.user.cart.map(async record => {
    const { MenuItem, quantity, totalCost } = record;
    const item = {
      MenuItem: await MenuItem,
      quantity,
      totalCost,
      record
    };
    console.log({ item })
    return item;
  }))
}

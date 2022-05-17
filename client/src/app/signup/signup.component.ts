import { Component, OnInit } from '@angular/core';
import { User, UserCategory } from '../../../../model/index';
import { ApplicationService } from '../application.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.sass']
})
export class SignupComponent implements OnInit {

  constructor(public api: ApplicationService) { }

  ngOnInit(): void { }

  newUser = <User>{ category: UserCategory.Shopper, name: '', email: '', Password: '' };
  error: string;

  async signup() {
    this.error = null;
    await this.api.signup(this.newUser).catch(error => Object.assign(this, { error }))
  }

}

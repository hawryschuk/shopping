import { Component, OnInit } from '@angular/core';
import { User } from '../../../../model/index';
import { ApplicationService } from '../application.service';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.sass']
})
export class UsersComponent implements OnInit {
  constructor(public api: ApplicationService) { }
  ngOnInit(): void { }
}

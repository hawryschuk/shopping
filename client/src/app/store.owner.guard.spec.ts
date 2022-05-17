import { TestBed } from '@angular/core/testing';

import { StoreOwnerGuard } from './store.owner.guard';

describe('StoreOwnerGuard', () => {
  let guard: StoreOwnerGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(StoreOwnerGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});

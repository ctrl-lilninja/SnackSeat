import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterShopPage } from './register-shop.page';

describe('RegisterShopPage', () => {
  let component: RegisterShopPage;
  let fixture: ComponentFixture<RegisterShopPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterShopPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

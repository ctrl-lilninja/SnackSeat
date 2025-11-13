import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RateShopPage } from './rate-shop.page';

describe('RateShopPage', () => {
  let component: RateShopPage;
  let fixture: ComponentFixture<RateShopPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RateShopPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

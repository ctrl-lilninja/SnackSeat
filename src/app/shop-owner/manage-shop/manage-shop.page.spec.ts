import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageShopPage } from './manage-shop.page';

describe('ManageShopPage', () => {
  let component: ManageShopPage;
  let fixture: ComponentFixture<ManageShopPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageShopPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

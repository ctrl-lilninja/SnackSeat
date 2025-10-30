import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowseShopsPage } from './browse-shops.page';

describe('BrowseShopsPage', () => {
  let component: BrowseShopsPage;
  let fixture: ComponentFixture<BrowseShopsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BrowseShopsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

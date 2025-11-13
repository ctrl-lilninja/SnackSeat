import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewRatingsPage } from './view-ratings.page';

describe('ViewRatingsPage', () => {
  let component: ViewRatingsPage;
  let fixture: ComponentFixture<ViewRatingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewRatingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

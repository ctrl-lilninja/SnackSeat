import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageReservationsPage } from './manage-reservations.page';

describe('ManageReservationsPage', () => {
  let component: ManageReservationsPage;
  let fixture: ComponentFixture<ManageReservationsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageReservationsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

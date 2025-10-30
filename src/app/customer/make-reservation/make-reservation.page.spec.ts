import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MakeReservationPage } from './make-reservation.page';

describe('MakeReservationPage', () => {
  let component: MakeReservationPage;
  let fixture: ComponentFixture<MakeReservationPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MakeReservationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MakeReservationPageRoutingModule } from './make-reservation-routing.module';

import { MakeReservationPage } from './make-reservation.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MakeReservationPageRoutingModule
  ],
  declarations: [MakeReservationPage]
})
export class MakeReservationPageModule {}

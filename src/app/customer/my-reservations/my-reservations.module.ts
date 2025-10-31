import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MyReservationsPageRoutingModule } from './my-reservations-routing.module';

import { MyReservationsPage } from './my-reservations.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    MyReservationsPageRoutingModule
  ],
  declarations: [MyReservationsPage]
})
export class MyReservationsPageModule {}

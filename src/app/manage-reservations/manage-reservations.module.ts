import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManageReservationsPageRoutingModule } from './manage-reservations-routing.module';

import { ManageReservationsPage } from './manage-reservations.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ManageReservationsPageRoutingModule
  ],
  declarations: [ManageReservationsPage]
})
export class ManageReservationsPageModule {}

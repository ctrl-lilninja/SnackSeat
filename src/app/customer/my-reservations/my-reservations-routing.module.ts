import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MyReservationsPage } from './my-reservations.page';

const routes: Routes = [
  {
    path: '',
    component: MyReservationsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyReservationsPageRoutingModule {}

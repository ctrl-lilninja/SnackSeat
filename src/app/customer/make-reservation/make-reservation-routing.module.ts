import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MakeReservationPage } from './make-reservation.page';

const routes: Routes = [
  {
    path: '',
    component: MakeReservationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MakeReservationPageRoutingModule {}

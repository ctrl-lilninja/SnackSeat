import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageReservationsPage } from './manage-reservations.page';

const routes: Routes = [
  {
    path: '',
    component: ManageReservationsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageReservationsPageRoutingModule {}

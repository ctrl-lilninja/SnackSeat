import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewRatingsPage } from './view-ratings.page';

const routes: Routes = [
  {
    path: '',
    component: ViewRatingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ViewRatingsPageRoutingModule {}

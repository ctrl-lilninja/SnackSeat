import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BrowseShopsPage } from './browse-shops.page';

const routes: Routes = [
  {
    path: '',
    component: BrowseShopsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BrowseShopsPageRoutingModule {}

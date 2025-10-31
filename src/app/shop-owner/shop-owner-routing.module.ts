import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShopOwnerPage } from './shop-owner.page';

const routes: Routes = [
  {
    path: '',
    component: ShopOwnerPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShopOwnerPageRoutingModule {}

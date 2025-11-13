import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ShopOwnerPage } from './shop-owner.page';

const routes: Routes = [
  {
    path: '',
    component: ShopOwnerPage
  },
  {
    path: 'view-ratings',
    loadChildren: () => import('../customer/view-ratings/view-ratings.module').then( m => m.ViewRatingsPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ShopOwnerPageRoutingModule {}

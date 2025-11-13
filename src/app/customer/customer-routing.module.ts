import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CustomerPage } from './customer.page';

const routes: Routes = [
  {
    path: '',
    component: CustomerPage
  },  {
    path: 'rate-shop',
    loadChildren: () => import('./rate-shop/rate-shop.module').then( m => m.RateShopPageModule)
  },
  {
    path: 'view-ratings',
    loadChildren: () => import('./view-ratings/view-ratings.module').then( m => m.ViewRatingsPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CustomerPageRoutingModule {}

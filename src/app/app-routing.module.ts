import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AdminGuard } from './guards/admin.guard';
import { CustomerGuard } from './guards/customer.guard';
import { ShopOwnerGuard } from './guards/shop-owner.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadChildren: () => import('./auth/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'auth/signup',
    loadChildren: () => import('./auth/signup/signup.module').then( m => m.SignupPageModule)
  },
  {
    path: 'admin/dashboard',
    loadChildren: () => import('./admin/dashboard/dashboard.module').then( m => m.DashboardPageModule),
    canActivate: [AdminGuard]
  },
  {
    path: 'customer/browse-shops',
    loadChildren: () => import('./customer/browse-shops/browse-shops.module').then( m => m.BrowseShopsPageModule),
    canActivate: [CustomerGuard]
  },
  {
    path: 'customer/make-reservation',
    loadChildren: () => import('./customer/make-reservation/make-reservation.module').then( m => m.MakeReservationPageModule),
    canActivate: [CustomerGuard]
  },
  {
    path: 'shop-owner/register-shop',
    loadChildren: () => import('./shop-owner/register-shop/register-shop.module').then( m => m.RegisterShopPageModule),
    canActivate: [ShopOwnerGuard]
  },
  {
    path: 'shop-owner/manage-shop',
    loadChildren: () => import('./shop-owner/manage-shop/manage-shop.module').then( m => m.ManageShopPageModule),
    canActivate: [ShopOwnerGuard]
  },

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

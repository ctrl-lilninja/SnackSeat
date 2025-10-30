import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManageShopPageRoutingModule } from './manage-shop-routing.module';

import { ManageShopPage } from './manage-shop.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManageShopPageRoutingModule
  ],
  declarations: [ManageShopPage]
})
export class ManageShopPageModule {}

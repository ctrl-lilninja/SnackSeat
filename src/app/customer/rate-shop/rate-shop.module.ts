import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RateShopPageRoutingModule } from './rate-shop-routing.module';

import { RateShopPage } from './rate-shop.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RateShopPageRoutingModule
  ],
  declarations: [RateShopPage]
})
export class RateShopPageModule {}

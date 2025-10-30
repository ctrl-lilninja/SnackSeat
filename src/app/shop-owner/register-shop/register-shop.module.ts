import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegisterShopPageRoutingModule } from './register-shop-routing.module';

import { RegisterShopPage } from './register-shop.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegisterShopPageRoutingModule
  ],
  declarations: [RegisterShopPage]
})
export class RegisterShopPageModule {}

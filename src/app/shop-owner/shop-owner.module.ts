import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ShopOwnerPageRoutingModule } from './shop-owner-routing.module';

import { ShopOwnerPage } from './shop-owner.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ShopOwnerPageRoutingModule
  ],
  declarations: [ShopOwnerPage]
})
export class ShopOwnerPageModule {}

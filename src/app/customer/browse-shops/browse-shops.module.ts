import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BrowseShopsPageRoutingModule } from './browse-shops-routing.module';

import { BrowseShopsPage } from './browse-shops.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BrowseShopsPageRoutingModule
  ],
  declarations: [BrowseShopsPage]
})
export class BrowseShopsPageModule {}

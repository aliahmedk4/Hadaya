import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CharityPageRoutingModule } from './charity-routing.module';
import { CharityPage } from './charity.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CharityPageRoutingModule
  ],
  declarations: [CharityPage]
})
export class CharityPageModule {}

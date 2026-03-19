import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AddDonorPageRoutingModule } from './add-donor-routing.module';
import { AddDonorPage } from './add-donor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AddDonorPageRoutingModule
  ],
  declarations: [AddDonorPage]
})
export class AddDonorPageModule {}

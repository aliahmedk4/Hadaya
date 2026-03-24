import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AddStaffPaymentPageRoutingModule } from './add-staff-payment-routing.module';
import { AddStaffPaymentPage } from './add-staff-payment.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, AddStaffPaymentPageRoutingModule],
  declarations: [AddStaffPaymentPage]
})
export class AddStaffPaymentPageModule {}

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AddStaffPaymentPage } from './add-staff-payment.page';

const routes: Routes = [{ path: '', component: AddStaffPaymentPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddStaffPaymentPageRoutingModule {}

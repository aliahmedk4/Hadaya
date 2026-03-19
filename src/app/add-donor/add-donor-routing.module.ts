import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AddDonorPage } from './add-donor.page';

const routes: Routes = [
  { path: '', component: AddDonorPage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddDonorPageRoutingModule {}

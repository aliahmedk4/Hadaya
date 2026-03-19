import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DonorsPage } from './donors.page';

const routes: Routes = [
  {
    path: '',
    component: DonorsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DonorsPageRoutingModule {}

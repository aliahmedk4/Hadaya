import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CharityPage } from './charity.page';

const routes: Routes = [
  { path: '', component: CharityPage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CharityPageRoutingModule {}

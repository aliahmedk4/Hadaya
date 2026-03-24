import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackupPage } from './backup.page';

const routes: Routes = [{ path: '', component: BackupPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BackupPageRoutingModule {}

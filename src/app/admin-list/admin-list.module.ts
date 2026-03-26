import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AdminListPage } from './admin-list.page';
import { AdminListPageRoutingModule } from './admin-list-routing.module';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, AdminListPageRoutingModule],
  declarations: [AdminListPage],
})
export class AdminListPageModule {}

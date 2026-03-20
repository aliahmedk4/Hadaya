import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HadithPageRoutingModule } from './hadith-routing.module';
import { HadithPage } from './hadith.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, HadithPageRoutingModule],
  declarations: [HadithPage]
})
export class HadithPageModule {}

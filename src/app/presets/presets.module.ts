import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ControlsPage } from '../controls/controls.page';
import { PresetsPage } from './presets.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: PresetsPage }])
  ],
  declarations: [PresetsPage]
})
export class PresetsPageModule {}

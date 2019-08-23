import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PresetsPage } from './presets.page';
import { ButtonComponent } from './presetcomponents/button/button.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: PresetsPage }])
  ],
  declarations: [PresetsPage, ButtonComponent],
  providers: [{provide: ButtonComponent}]
})
export class PresetsPageModule {}

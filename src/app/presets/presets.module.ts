import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PresetsPage } from './presets.page';
import { File } from '@ionic-native/file/ngx';
import { ButtonComponent } from './presetcomponents/button/button.component';
//import { ChartsModule } from 'ng2-charts';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    //ChartsModule,
    RouterModule.forChild([{ path: '', component: PresetsPage }])
  ],
  declarations: [PresetsPage, ButtonComponent],
  providers: [{provide: ButtonComponent}, File]
})
export class PresetsPageModule {}

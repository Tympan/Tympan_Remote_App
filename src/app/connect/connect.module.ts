import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConnectPage } from './connect.page';
import { AppVersion } from '@ionic-native/app-version/ngx';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([{ path: '', component: ConnectPage }])
  ],
  providers: [
    AppVersion,
  ],
  declarations: [ConnectPage]
})
export class ConnectPageModule {}

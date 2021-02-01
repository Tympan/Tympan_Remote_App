import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';
import { AppVersion } from '@ionic-native/app-version/ngx';

@Component({
  selector: 'app-tab3',
  templateUrl: 'connect.page.html',
  styleUrls: ['connect.page.scss']
})
export class ConnectPage {
    versionNumber: string;

    constructor(private platform: Platform, public remote: TympanRemote, public logger: Logger, public appVersion: AppVersion) {
      this.runVersion();
    }

    public async runVersion() {
      this.platform.ready()
      .then(()=>{
        return this.appVersion.getVersionNumber();
      }).then((value) => {
        this.versionNumber = value;
      }).catch((err) => {
        this.logger.log('Error getting app version number.');
        this.logger.log(err);
      });
    }
    
    public toggleActive(id: string) {
      if (this.remote.isActiveId(id)) {
        this.logger.log(`Setting ${id} as inactive`);
        this.remote.disconnectFromId(id);
      } else {
        this.logger.log(`Setting ${id} as active`);
        this.remote.connectToId(id);        
      }
    }

}

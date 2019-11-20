import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';
import { AppVersion } from '@ionic-native/app-version/ngx';

@Component({
  selector: 'app-tab3',
  templateUrl: 'connect.page.html',
  styleUrls: ['connect.page.scss']
})
export class ConnectPage {
    VersionNumber:string;
    constructor(public remote: TympanRemote, public logger:Logger, public appVersion: AppVersion) {
      {
        this.runVersion();
      }
    }

    public async runVersion(){
      this.appVersion.getVersionNumber().then(value => {
        this.VersionNumber = value;
      }).catch(err => {
        this.logger.log('Error getting app version number.');
        this.logger.log(err);
      });
    }
    public toggleActive(id: string) {
      if (this.remote.isActiveId(id)) {
        this.logger.log(`Setting ${id} as inactive`);
        this.remote.disconnect();
      } else {
        this.logger.log(`Setting ${id} as active`);
        this.remote.connectToId(id);        
      }
    }

}

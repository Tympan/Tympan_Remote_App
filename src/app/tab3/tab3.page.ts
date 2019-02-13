import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { TympanDevice } from '../../providers/tympan-device';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {
    public device: TympanDevice;

    constructor(public remote: TympanRemote) {
        this.device = this.remote.devices[0];
    }

    public setActive(i: number) {
      //this.remote.log(`Setting ${i} as active`);
      this.remote.setActiveDevice(i);
    }

}

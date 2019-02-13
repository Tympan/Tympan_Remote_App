import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { TympanDevice } from '../../providers/tympan-device';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
    public device: TympanDevice;

    constructor(public remote: TympanRemote) {
        this.device = this.remote.devices[0];
    }

    cmd(s: string) {
        this.remote.send(s);
    }
}

import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

    constructor(public remote: TympanRemote) {
    }

    public setActive(i: number) {
      //this.remote.log(`Setting ${i} as active`);
      this.remote.setActiveDevice(i);
    }

}

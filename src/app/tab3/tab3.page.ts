import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

    constructor(public remote: TympanRemote, private logger:Logger) {
    }

    public setActive(i: number) {
      //this.remote.log(`Setting ${i} as active`);
      this.remote.setActiveDevice(i);
    }

}

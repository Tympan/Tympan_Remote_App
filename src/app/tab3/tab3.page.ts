import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

    constructor(public remote: TympanRemote, public logger:Logger) {
    }

    public setActive(id: string) {
      this.logger.log(`Setting ${id} as active`);
      this.remote.setActiveDevice(id);
    }

}

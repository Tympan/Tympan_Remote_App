import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

    constructor(public remote: TympanRemote) {
    }

    cmd(s: string) {
        this.remote.send(s);
    }
}

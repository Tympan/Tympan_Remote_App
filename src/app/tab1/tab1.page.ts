import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {
    constructor(public remote: TympanRemote) {
    }

    cmd(s: string) {
        this.remote.send(s);
    }
}

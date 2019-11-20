import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';
import { ButtonComponent } from './presetcomponents/button/button.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'presets.page.html',
  styleUrls: ['presets.page.scss', '../prescription/prescription.page.scss']
})
export class PresetsPage {
    textInput: string;

    constructor(public remote: TympanRemote, public logger:Logger, public buttonComp: ButtonComponent) {
    }

    cmd(s: string) {
        this.remote.send(s);
    }

}

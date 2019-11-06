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

    constructor(public remote: TympanRemote, public logger:Logger, public buttonComp: ButtonComponent) {
    }

    cmd(s: string) {
        this.remote.send(s);
        //this.applyStyleToBtnWithCmd(s);
    }

    /*
    applyStyleToBtnWithCmd(s: string) {
    	for (let page of this.remote.pages) {
    		for (let card of page.cards) {
    			for (let button of card.buttons) {
    				if (button.cmd == s) {
    					console.log('FOUND BUTTON!');
    					let str = 'STATE=' + 'BTN:' + button.id + ':';
    					if (this.remote.btn[button.id].isOn) {
	    					str += '0';
    					} else {
	    					str += '1';
    					}
    					this.remote.parseStateStringFromDevice(str);
    				}
    			}
    		}
    	}
    }
    */
}

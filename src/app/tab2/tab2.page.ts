import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {

    constructor(public remote: TympanRemote, public logger:Logger) {
    }

    cmd(s: string) {
        this.remote.send(s);
        //this.applyStyleToBtnWithCmd(s);
    }

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
}

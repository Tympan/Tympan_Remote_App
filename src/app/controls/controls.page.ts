import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';

@Component({
  selector: 'app-tab1',
  templateUrl: 'controls.page.html',
  styleUrls: ['controls.page.scss']
})

export class ControlsPage {

    constructor(public remote: TympanRemote, public logger:Logger) {
    };

    cmd(s: string) {
        this.remote.send(s);
    };

    sendInputCard(card: any) {
    	this.remote.sendInputCard(card);
    }

    moveLeft(input: any) {
    	if (input.currentCol>0) {
	    	input.currentCol--;
    	}
    }

    moveRight(input: any) {
    	if (input.currentCol<input.columns.length-1) {
	    	input.currentCol++;
    	}
    }

}

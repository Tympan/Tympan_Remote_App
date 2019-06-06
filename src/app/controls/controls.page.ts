import { Component } from '@angular/core';
import { TympanRemote } from '../../providers/tympan-remote';
import { Logger } from '../../providers/logger';

const DEFAULT_DSL = {
	'attack': 30,
	'release': 300,
  	'maxdB': 115,
  	'speaker': 0,  
  	'numChannels': 8,  
  	'freqs': [0, 317.1666, 502.9734, 797.6319, 1264.9, 2005.9, 3181.1, 5044.7], 
  	'compressionLowSPL': [0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57], 
  	'expansionEndKnee': [45.0, 45.0, 33.0, 32.0, 36.0, 34.0, 36.0, 40.0], 
  	'compressionStartGain': [20., 20., 25., 30., 30., 30., 30., 30.], 
  	'compressionRatio': [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5], 
  	'compressionStartKnee': [50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0, 50.0], 
  	'threshold': [90., 90., 90., 90., 90., 91., 92., 93.],  
};

const THIS_PAGE = {
	'title': 'BoysTown Algorithm',
	'cards': [
		{
			'name': 'DSL',
			'inputs': [
				{'label': 'Attack', 'type': 'numeric', 'value': 30},
				{'label': 'Release', 'type': 'numeric', 'value': 300},
				{'label': 'maxdB', 'type': 'numeric', 'value': 115},
				{'label': 'speaker', 'type': 'numeric', 'value': 0},
				{'label': 'numChannels', 'type': 'numeric', 'disabled': true, 'value': 8},
				{'label': 'Band Data', 'type': 'grid', 'numRows': 8, 'indexLabel': 'Band', 'columns': [
	              {'label': 'Frequency', 'values': [0, 317.1666, 502.9734, 797.6319, 1264.9, 2005.9, 3181.1, 5044.7]},
	              {'label': 'Low SPL Compression Ratio', 'values': [0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57]},
	              {'label': 'Compression Start Gain', 'values': [20., 20., 25., 30., 30., 30., 30., 30.]},
	              {'label': 'Compression Start Knee', 'values': [20., 20., 25., 30., 30., 30., 30., 30.]},
	              {'label': 'Compression Ratio', 'values': [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5]},
	              {'label': 'Expansion End Knee', 'values': [45.0, 45.0, 33.0, 32.0, 36.0, 34.0, 36.0, 40.0]},
	              {'label': 'Threshold', 'values': [90., 90., 90., 90., 90., 91., 92., 93.]},
				]},
			],			
			'submitButton': {'prefix': 'Mdsl'}
		},
		{
			'name': 'WDRC',
			'inputs': [
				{'label': 'Attack', 'type': 'numeric', 'value': 5},
				{'label': 'Release', 'type': 'numeric', 'value': 300},
				{'label': 'Sample Rate', 'type': 'numeric', 'value': 24000},
				{'label': 'maxdB', 'type': 'numeric', 'value': 115},
				{'label': 'Low SPL Compression Ratio', 'type': 'numeric', 'value': 1.0},
				{'label': 'Compression Start Gain', 'type': 'numeric', 'value': 0.},
				{'label': 'Compression Start Knee', 'type': 'numeric', 'value': 115.},
				{'label': 'Compression Ratio', 'type': 'numeric', 'value': 1.},
				{'label': 'Expansion End Knee', 'type': 'numeric', 'value': 0.0},
				{'label': 'Threshold', 'type': 'numeric', 'value': 98.0},
			],
			'submitButton': {'prefix': 'Mwdrc'}
		},
	],
};

const DEFAULT_WDRC = {
	'attack': 5, // attack time (ms)
  	'release': 300.,    // release time (ms)
  	'sampRate': 24000.,  // sampling rate (Hz)...ignored.  Set globally in the main program.
  	'maxdB': 115.,    // maxdB.  calibration.  dB SPL for signal at 0dBFS.  Needs to be tailored to mic, spkrs, and mic gain.
  	'compressionLowSPL': 1.0,      // compression ratio for lowest-SPL region (ie, the expansion region) (should be < 1.0.  set to 1.0 for linear)
  	'expansionEndKnee': 0.0,      // kneepoint of end of expansion region (set very low to defeat the expansion)
  	'compressionStartGain': 0.,      // compression-start gain....set to zero for pure limitter
  	'compressionStartKnee': 115.,    // compression-start kneepoint...set to some high value to make it not relevant
  	'compressionRatio': 1.,      // compression ratio...set to 1.0 to make linear (to defeat)
  	'threshold': 98.0,      // output limiting threshold...hardwired to compression ratio of 10.0
};

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

    sendInputCard(input: any) {
    	console.log('sending...');
    	console.log(input);
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

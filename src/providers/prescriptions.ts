import * as _ from 'lodash';

import {
  DATASTREAM_PREFIX_DSL,
  numberAsCharStr,
  charStrToNumber,
  isNumeric
} from './tympan-config';


function parseManyFloats(arr: string[], start: number, count: number): number[] {
  let data = [];
  for (let idx = 0; idx < count; idx++) {
    data[idx] = parseFloat(arr[start+idx]);
  }
  return data;
}

/**
 * This class contains the variables and methods for the BoysTown DSL Prescription.
 */
export class DSL {  
  public name: string;
  public attack: number; // float
  public release: number; // float
  public nChan: number; // int
  public maxdB: number; // float
  public LR: number; // int; unused for now
  public cross_freq: number[]; // int
  public exp_cr: number[]; // float
  public exp_end_knee: number[]; // float
  public tkgain: number[]; // float
  public cr: number[]; // float
  public tk: number[]; // float
  public bolt: number[]; // float
  public submitPrefix: string;
  public MXCH; // An int, telling us about the DSL size on the device (max # of channels allowed) 

  constructor() {
    this.name = 'Multiband Compression';
    this.attack = 30;
    this.release = 300;
    this.maxdB = 115;
    this.LR = 0; // int32; unused
    this.nChan = 8; // int32
    this.cross_freq = [0, 317, 503, 798, 1265, 2006, 3181, 5045];
    this.exp_cr = [0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57];
    this.exp_end_knee = [45.0, 45.0, 33.0, 32.0, 36.0, 34.0, 36.0, 40.0];
    this.tkgain = [20., 20., 25., 30., 30., 30., 30., 30.];
    this.cr = [20., 20., 25., 30., 30., 30., 30., 30.];
    this.tk = [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5];
    this.bolt = [90., 90., 90., 90., 90., 91., 92., 93.];
    this.submitPrefix = DATASTREAM_PREFIX_DSL;
    this.MXCH = 32;
  }

  public asPage(): any {
    const page = {
      'title': 'Boys Town Algorithm',
      'id': 'dsl',
      'cards': [
        {
          'name': this.name,
          'inputs': [
            {'label': 'Attack (msec)', 'type': 'float', 'value': this.attack},
            {'label': 'Release (msec)', 'type': 'float', 'value': this.release},
            {'label': 'Number of Channels (1-8)', 'type': 'int', 'value': this.nChan, 'disabled': true},
            {'label': 'Output at Full Scale (dB SPL)', 'type': 'float', 'value': this.maxdB},
            {'label': 'Band Data', 'type': 'grid', 'numRows': this.nChan, 'indexLabel': 'Band', 'columns': [
              {'label': 'Crossover Frequency (Hz)', 'type': 'int', 'values': this.cross_freq},
              {'label': 'Low SPL: Compression Ratio', 'type': 'float', 'values': this.exp_cr},
              {'label': 'Low SPL: End Knee (dB SPL)', 'type': 'float', 'values': this.exp_end_knee},
              {'label': 'Linear Region: Gain (dB)', 'type': 'float', 'values': this.tkgain},
              {'label': 'Compression: Start Knee (dB SPL)', 'type': 'float', 'values': this.cr},
              {'label': 'Compression: Ratio', 'type': 'float', 'values': this.tk},
              {'label': 'Limiter: Threshold (dB SPL)', 'type': 'float', 'values': this.bolt},
            ]},
          ],
          'submitButton': {'prefix': this.submitPrefix}
        }
      ]
    };

    return page;
  }

  public fromDataStream(stream: string) {
    let newDSL = _.cloneDeep(this); // Create a new DSL, just in case there's an error in the stream somewhere.
    console.log('stream is:' + stream);
    const colon = stream.indexOf(':');
    newDSL.MXCH = parseInt(stream.slice(0,colon) , 10);
    stream = stream.slice(colon+1);

    let valStrings = stream.split(',');

    let ctr = 0;
    newDSL.attack = parseFloat(valStrings[ctr]); ctr++;
    newDSL.release = parseFloat(valStrings[ctr]); ctr++;
    newDSL.maxdB = parseFloat(valStrings[ctr]); ctr++;
    newDSL.LR = parseInt(valStrings[ctr] , 10); ctr++;
    newDSL.nChan = parseInt(valStrings[ctr] , 10); ctr++;
    if (1) {
      newDSL.cross_freq = []; for (let c = 0; c<newDSL.nChan; c++) { newDSL.cross_freq[c] = parseFloat(valStrings[ctr]); ctr++; }
      newDSL.exp_cr = []; for (let c = 0; c<newDSL.nChan; c++) { newDSL.exp_cr[c] = parseFloat(valStrings[ctr]); ctr++; }
      newDSL.exp_end_knee = []; for (let c = 0; c<newDSL.nChan; c++) { newDSL.exp_end_knee[c] = parseFloat(valStrings[ctr]); ctr++; }
      newDSL.tkgain = []; for (let c = 0; c<newDSL.nChan; c++) { newDSL.tkgain[c] = parseFloat(valStrings[ctr]); ctr++; }
      newDSL.cr = []; for (let c = 0; c<newDSL.nChan; c++) { newDSL.cr[c] = parseFloat(valStrings[ctr]); ctr++; }
      newDSL.tk = []; for (let c = 0; c<newDSL.nChan; c++) { newDSL.tk[c] = parseFloat(valStrings[ctr]); ctr++; }
      newDSL.bolt = []; for (let c = 0; c<newDSL.nChan; c++) { newDSL.bolt[c] = parseFloat(valStrings[ctr]); ctr++; }
    } else {
      newDSL.cross_freq =   parseManyFloats(valStrings, ctr, newDSL.nChan); ctr = ctr + newDSL.nChan;
      newDSL.exp_cr =       parseManyFloats(valStrings, ctr, newDSL.nChan); ctr = ctr + newDSL.nChan;
      newDSL.exp_end_knee = parseManyFloats(valStrings, ctr, newDSL.nChan); ctr = ctr + newDSL.nChan;
      newDSL.tkgain =       parseManyFloats(valStrings, ctr, newDSL.nChan); ctr = ctr + newDSL.nChan;
      newDSL.cr =           parseManyFloats(valStrings, ctr, newDSL.nChan); ctr = ctr + newDSL.nChan;
      newDSL.tk =           parseManyFloats(valStrings, ctr, newDSL.nChan); ctr = ctr + newDSL.nChan;
      newDSL.bolt =         parseManyFloats(valStrings, ctr, newDSL.nChan); ctr = ctr + newDSL.nChan;      
    }

    /* Check to see if the new DSL is valid: */
    let checkVal = parseInt(valStrings[ctr]); ctr++;
    if (checkVal === newDSL.MXCH) {
      console.log('MXCH checks out.');
      Object.assign(this, newDSL); // Can do a shallow copy, sine we already did a deep clone
    } else {
      console.log('DSL Transmission Error!');
    }
  }
}

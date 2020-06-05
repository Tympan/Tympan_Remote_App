import * as _ from 'lodash';

import {
  DATASTREAM_PREFIX_DSL,
  DATASTREAM_PREFIX_GHA,
  DATASTREAM_PREFIX_AFC,
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
  public cross_freq: number[]; // float
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
    this.cross_freq = [0., 317., 503., 798., 1265., 2006., 3181., 5045.];
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
              {'label': 'Crossover Frequency (Hz)', 'type': 'float', 'values': this.cross_freq},
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
    let checkVal = parseInt(valStrings[ctr], 10); ctr++;
    if (checkVal === newDSL.MXCH) {
      console.log('MXCH checks out.');
      Object.assign(this, newDSL); // Can do a shallow copy, sine we already did a deep clone
    } else {
      console.log('DSL Transmission Error!');
    }
  }
}

/**
 * This class contains the variables and methods for the BoysTown WDRC (GHA) Prescription.
 */
export class WDRC {  
  public name: string;
  public attack: number;               // float.  attack time (ms), unused in this class
  public release: number;              // float.  release time (ms), unused in this class
  public fs: number;                   // float.  sampling rate (Hz), set through other means in this class
  public maxdB: number;                // float.  maximum signal (dB SPL)...I think this is the SPL corresponding to signal with rms of 1.0
  public exp_cr: number;               // float.  compression ratio for low-SPL region (ie, the expander)
  public exp_end_knee: number;         // float.  expansion-end kneepoint
  public tkgain: number;               // float.  compression-start gain
  public tk: number;                   // float.  compression-start kneepoint
  public cr: number;                   // float.  compression ratio
  public bolt: number;                 // float.  broadband output limiting threshold
  public submitPrefix: string;

  constructor() {
    this.name = 'Broadband Output Compression';
    this.attack = 30;
    this.release = 300;
    this.fs = 24000; // ignored
    this.maxdB = 115;
    this.exp_cr = 1.0;
    this.exp_end_knee = 0.0; // int32
    this.tkgain = 0.0;
    this.tk = 115.0;
    this.cr = 1;
    this.bolt = 98.0;
    this.submitPrefix = DATASTREAM_PREFIX_GHA;
  }

  public asPage(): any {
    const page = {
      'title': 'Boys Town Algorithm',
      'id': 'gha',
      'cards': [
        {
          'name': this.name,
          'inputs': [
            {'label': 'Attack (msec)', 'type': 'float', 'value': this.attack},
            {'label': 'Release (msec)', 'type': 'float', 'value': this.release},
            {'label': 'Low SPL: Compression Ratio', 'type': 'float', 'value': this.exp_cr},
            {'label': 'Low SPL: End Knee (dB SPL)', 'type': 'float', 'value': this.exp_end_knee},
            {'label': 'Linear Region: Gain (dB)', 'type': 'float', 'value': this.tkgain},
            {'label': 'Compression: Start Knee (dB SPL)', 'type': 'float', 'value': this.tk},
            {'label': 'Compression: Ratio', 'type': 'float', 'value': this.cr},
            {'label': 'Limiter: Threshold (dB SPL)', 'type': 'float', 'value': this.bolt},
          ],
          'submitButton': {'prefix': this.submitPrefix}
        },
      ]
    };

    return page;
  }

  public fromDataStream(stream: string) {
    let newWDRC = _.cloneDeep(this); // Create a new WDRC, just in case there's an error in the stream somewhere.
    console.log('stream is:' + stream);
    const colon = stream.indexOf(':');
    let checkVal1 = parseInt(stream.slice(0,colon) , 10);
    stream = stream.slice(colon+1);

    let valStrings = stream.split(',');

    let ctr = 0;
    newWDRC.attack = parseFloat(valStrings[ctr]); ctr++;
    newWDRC.release = parseFloat(valStrings[ctr]); ctr++;
    newWDRC.fs = parseFloat(valStrings[ctr]); ctr++;
    newWDRC.maxdB = parseFloat(valStrings[ctr]); ctr++;

    newWDRC.exp_cr = parseFloat(valStrings[ctr]); ctr++;
    newWDRC.exp_end_knee = parseFloat(valStrings[ctr]); ctr++;
    newWDRC.tkgain = parseFloat(valStrings[ctr]); ctr++;
    newWDRC.tk = parseFloat(valStrings[ctr]); ctr++;
    newWDRC.cr = parseFloat(valStrings[ctr]); ctr++;
    newWDRC.bolt = parseFloat(valStrings[ctr]); ctr++;

    /* Check to see if the new DSL is valid: */
    let checkVal2 = parseInt(valStrings[ctr], 10); ctr++;
    if (checkVal1 === checkVal2) {
      console.log('WDRC prescription checks out.');
      Object.assign(this, newWDRC); // Can do a shallow copy, sine we already did a deep clone
    } else {
      console.log('WDRC Transmission Error!');
    }
  }
}


/**
 * This class contains the variables and methods for the BoysTown WDRC (GHA) Prescription.
 */
export class AFC {  
  public name: string;
  public default_to_active: number;     // int.  enable AFC at startup?  1=active. 0=disabled.
  public afl: number;                   // int.  length (samples) of adaptive filter for modeling feedback path.
  public mu: number;                    // float.  mu, scale factor for how fast the adaptive filter adapts (bigger is faster)
  public rho: number;                   // float.  rho, smoothing factor for estimating audio envelope (bigger is a longer average)
  public eps: number;                   // float.  eps, when est the audio envelope, this is the min allowed level (avoids divide-by-zero)
  public submitPrefix: string;

  constructor() {
    this.name = 'Broadband Output Compression';
    this.default_to_active = 0; 
    this.afl = 100; 
    this.mu = 1.0e-3; 
    this.rho = 0.9; 
    this.eps = 0.008;
    this.submitPrefix = DATASTREAM_PREFIX_AFC;
  }

  public asPage(): any {
    const page = {
      'title': 'Boys Town Algorithm',
      'id': 'afc',
      'cards': [
        {
          'name': this.name,
          'inputs': [
            {'label': 'Enable (1=yes, 0=no)', 'type': 'int', 'value': this.default_to_active},
            {'label': 'Filter Length (samples, 0-256)', 'type': 'int', 'value': this.afl},
            {'label': 'Adaptation Factor (mu, 0.0-1.0)', 'type': 'float', 'value': this.mu},
            {'label': 'Smoothing Factor (rho, 0.0-1.0)', 'type': 'float', 'value': this.rho},
            {'label': 'Min Allowed Envelope (eps, 0-1.0)', 'type': 'float', 'value': this.eps},
          ],
          'submitButton': {'prefix': this.submitPrefix}
        },
      ]
    };

    return page;
  }

  public fromDataStream(stream: string) {
    let newAFC = _.cloneDeep(this); // Create a new AFC, just in case there's an error in the stream somewhere.
    console.log('stream is:' + stream);
    const colon = stream.indexOf(':');
    let checkVal1 = parseInt(stream.slice(0,colon) , 10);
    stream = stream.slice(colon+1);

    let valStrings = stream.split(',');

    let ctr = 0;
    newAFC.default_to_active = parseInt(valStrings[ctr] , 10); ctr++;
    newAFC.afl = parseInt(valStrings[ctr] , 10); ctr++;
    newAFC.mu = parseFloat(valStrings[ctr]); ctr++;
    newAFC.rho = parseFloat(valStrings[ctr]); ctr++;
    newAFC.eps = parseFloat(valStrings[ctr]); ctr++;

    /* Check to see if the new DSL is valid: */
    let checkVal2 = parseInt(valStrings[ctr], 10); ctr++;
    if (checkVal1 === checkVal2) {
      console.log('AFC prescription checks out.');
      Object.assign(this, newAFC); // Can do a shallow copy, sine we already did a deep clone
    } else {
      console.log('AFC Transmission Error!');
    }
  }
}

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
      'title': '7oys Town Algorithm',
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
    console.log('stream is:' + stream);
    const colon = stream.indexOf(':');
    this.MXCH = parseInt(stream.slice(0,colon) , 10);
    stream = stream.slice(colon+1);

    let valStrings = stream.split(',');

    let ctr = 0;
    this.attack = parseFloat(valStrings[ctr]); ctr++;
    this.release = parseFloat(valStrings[ctr]); ctr++;
    this.maxdB = parseFloat(valStrings[ctr]); ctr++;
    this.LR = parseInt(valStrings[ctr] , 10); ctr++;
    this.nChan = parseInt(valStrings[ctr] , 10); ctr++;
    if (1) {
      this.cross_freq = []; for (let c = 0; c<this.nChan; c++) { this.cross_freq[c] = parseFloat(valStrings[ctr]); ctr++; }
      this.exp_cr = []; for (let c = 0; c<this.nChan; c++) { this.exp_cr[c] = parseFloat(valStrings[ctr]); ctr++; }
      this.exp_end_knee = []; for (let c = 0; c<this.nChan; c++) { this.exp_end_knee[c] = parseFloat(valStrings[ctr]); ctr++; }
      this.tkgain = []; for (let c = 0; c<this.nChan; c++) { this.tkgain[c] = parseFloat(valStrings[ctr]); ctr++; }
      this.cr = []; for (let c = 0; c<this.nChan; c++) { this.cr[c] = parseFloat(valStrings[ctr]); ctr++; }
      this.tk = []; for (let c = 0; c<this.nChan; c++) { this.tk[c] = parseFloat(valStrings[ctr]); ctr++; }
      this.bolt = []; for (let c = 0; c<this.nChan; c++) { this.bolt[c] = parseFloat(valStrings[ctr]); ctr++; }
    } else {
      this.cross_freq =   parseManyFloats(valStrings, ctr, this.nChan); ctr = ctr + this.nChan;
      this.exp_cr =       parseManyFloats(valStrings, ctr, this.nChan); ctr = ctr + this.nChan;
      this.exp_end_knee = parseManyFloats(valStrings, ctr, this.nChan); ctr = ctr + this.nChan;
      this.tkgain =       parseManyFloats(valStrings, ctr, this.nChan); ctr = ctr + this.nChan;
      this.cr =           parseManyFloats(valStrings, ctr, this.nChan); ctr = ctr + this.nChan;
      this.tk =           parseManyFloats(valStrings, ctr, this.nChan); ctr = ctr + this.nChan;
      this.bolt =         parseManyFloats(valStrings, ctr, this.nChan); ctr = ctr + this.nChan;      
    }

    let checkVal = parseInt(valStrings[ctr]); ctr++;
    if (checkVal === this.MXCH) {
      console.log('MXCH checks out.');
    } else {
      console.log('DSL Transmission Error!');
    }

    console.log(this);
  }
}

import {
  DATASTREAM_PREFIX_DSL,
  numberAsCharStr,
  charStrToNumber,
  isNumeric
} from './tympan-config';

/**
 * This class contains the variables and methods for the BoysTown DSL Prescription.
 */
export class DSL {  
  public name: string;
  public attack: number; // float
  public release: number; // float
  public nChan: number; // int
  public dBFull: number; // float
  public LR: number; // int; unused for now
  public crossoverFreq: number[]; // int
  public lowSPLCR: number[]; // float
  public lowSPLKnee: number[]; // float
  public linearGain: number[]; // float
  public compKnee: number[]; // float
  public compRatio: number[]; // float
  public threshold: number[]; // float
  public submitPrefix: string;

  constructor() {
    this.name = 'Multiband Compression';
    this.attack = 30;
    this.release = 300;
    this.nChan = 8;
    this.dBFull = 115;
    this.LR = 0; // unused
    this.crossoverFreq = [0, 317, 503, 798, 1265, 2006, 3181, 5045];
    this.lowSPLCR = [0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57];
    this.lowSPLKnee = [45.0, 45.0, 33.0, 32.0, 36.0, 34.0, 36.0, 40.0];
    this.linearGain = [20., 20., 25., 30., 30., 30., 30., 30.];
    this.compKnee = [20., 20., 25., 30., 30., 30., 30., 30.];
    this.compRatio = [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5];
    this.threshold = [90., 90., 90., 90., 90., 91., 92., 93.];
    this.submitPrefix = DATASTREAM_PREFIX_DSL;
  }

  public asPage(): any {
    const page = {
     'name': this.name,
      'inputs': [
        {'label': 'Attack (msec)', 'type': 'float', 'value': this.attack},
        {'label': 'Release (msec)', 'type': 'float', 'value': this.release},
        {'label': 'Number of Channels (1-8)', 'type': 'int', 'value': this.nChan, 'disabled': true},
        {'label': 'Output at Full Scale (dB SPL)', 'type': 'float', 'value': this.dBFull},
        {'label': 'Band Data', 'type': 'grid', 'numRows': this.nChan, 'indexLabel': 'Band', 'columns': [
          {'label': 'Crossover Frequency (Hz)', 'type': 'int', 'values': this.crossoverFreq},
          {'label': 'Low SPL: Compression Ratio', 'type': 'float', 'values': this.lowSPLCR},
          {'label': 'Low SPL: End Knee (dB SPL)', 'type': 'float', 'values': this.lowSPLKnee},
          {'label': 'Linear Region: Gain (dB)', 'type': 'float', 'values': this.linearGain},
          {'label': 'Compression: Start Knee (dB SPL)', 'type': 'float', 'values': this.compKnee},
          {'label': 'Compression: Ratio', 'type': 'float', 'values': this.compRatio},
          {'label': 'Limiter: Threshold (dB SPL)', 'type': 'float', 'values': this.threshold},
        ]},
      ],      
      'submitButton': {'prefix': this.submitPrefix}
    };

    return page;
  }

  public fromDataStream(stream: string) {

    let ctr = 0;
    this.attack = charStrToNumber(stream, ctr, 'float32'); ctr = ctr+4;
    this.release = charStrToNumber(stream, ctr, 'float32'); ctr = ctr+4;
    this.dBFull = charStrToNumber(stream, ctr, 'float32'); ctr = ctr+4;
    this.LR = charStrToNumber(stream, ctr, 'int32'); ctr = ctr+4;
    this.nChan = charStrToNumber(stream, ctr, 'int32'); ctr = ctr+4;
    let table = [];
    for (let r=0; r<7; r++) {
      table[r] = [];
      for (let c=0; c<7; c++) {
        table[r][c] = charStrToNumber(stream, ctr, 'float32'); ctr = ctr+4;
      }
    }
  }
}
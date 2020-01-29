import ieee754 from 'ieee754';

enum ByteOrder {MSB, LSB};

export interface iDevice {
  id: string;
  name: string;
  status: string;
  uuid?: string;
  class?: number;
  address?: string;
  rssi?: number;
  emulated?: boolean;
}

export const DEVICE_1: iDevice = {
  id: 'mo:ck:01',
  name: 'mock1',
  status: '',
  emulated: true,
};

export const DEVICE_2: iDevice = {
  id: 'mo:ck:02',
  name: 'mock2',
  status: '',
  emulated: true,
};

/* Some definitions that need to be the same in the app and in the Tympan code: */
export const DATASTREAM_START_CHAR = String.fromCharCode(0x02);
export const DATASTREAM_SEPARATOR = String.fromCharCode(0x03);
export const DATASTREAM_END_CHAR = String.fromCharCode(0x04);
export const DATASTREAM_PREFIX_GHA = 'gha';
export const DATASTREAM_PREFIX_DSL = 'dsl';
export const DATASTREAM_PREFIX_AFC = 'afc';

export const BUTTON_STYLE_ON = {color: 'success', isOn: true, class: 'btn-on'};
export const BUTTON_STYLE_OFF = {color: 'medium', isOn: false, class: 'btn-off'};
export const BUTTON_STYLE_NONE = {color: 'unset', isOn: undefined, class: 'btn-none'};

export const BOYSTOWN_PAGE_DSL = {
  'title': 'Boys Town Algorithm',
  'id': 'dsl',
  'cards': [
    {
      'name': 'Multiband Compression',
      'inputs': [
        {'label': 'Attack (msec)', 'type': 'float', 'value': 30},
        {'label': 'Release (msec)', 'type': 'float', 'value': 300},
        {'label': 'Number of Channels (1-8)', 'type': 'int', 'value': 8, 'disabled': true},
        {'label': 'Output at Full Scale (db SPL)', 'type': 'float', 'value': 115},
        {'label': 'Band Data', 'type': 'grid', 'numRows': 8, 'indexLabel': 'Band', 'columns': [
                {'label': 'Crossover Frequency (Hz)', 'type': 'float', 'values': [0, 317, 503, 798, 1265, 2006, 3181, 5045]},
                {'label': 'Low SPL: Compression Ratio', 'type': 'float', 'values': [0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57]},
                {'label': 'Low SPL: End Knee (dB SPL)', 'type': 'float', 'values': [45.0, 45.0, 33.0, 32.0, 36.0, 34.0, 36.0, 40.0]},
                {'label': 'Linear Region: Gain (dB)', 'type': 'float', 'values': [20., 20., 25., 30., 30., 30., 30., 30.]},
                {'label': 'Compression: Start Knee (dB SPL)', 'type': 'float', 'values': [20., 20., 25., 30., 30., 30., 30., 30.]},
                {'label': 'Compression: Ratio', 'type': 'float', 'values': [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5]},
                {'label': 'Limiter: Threshold (dB SPL)', 'type': 'float', 'values': [90., 90., 90., 90., 90., 91., 92., 93.]},
        ]},
      ],      
      'submitButton': {'prefix': DATASTREAM_PREFIX_DSL}
    },
  ],
};

export const BOYSTOWN_PAGE_WDRC = {
      'title': 'Boys Town Algorithm',
      'id': 'gha',
      'cards': [
    {
      'name': 'Broadband Output Compression',
      'inputs': [
        {'label': 'Attack (msec)', 'type': 'float', 'value': 5},
        {'label': 'Release (msec)', 'type': 'float', 'value': 300},
        {'label': 'Low SPL: Compression Ratio', 'type': 'float', 'value': 1.0},
        {'label': 'Low SPL: End Knee (dB SPL)', 'type': 'float', 'value': 0.0},
        {'label': 'Linear Region: Gain (dB)', 'type': 'float', 'value': 0.},
        {'label': 'Compression: Start Knee (dB SPL)', 'type': 'float', 'value': 115.},
        {'label': 'Compression: Ratio', 'type': 'float', 'value': 1.},
        {'label': 'Limiter: Threshold (dB SPL)', 'type': 'float', 'value': 98.0},
      ],
      'submitButton': {'prefix': DATASTREAM_PREFIX_GHA}
    },
  ],
};

export const BOYSTOWN_PAGE_AFC = {
      'title': 'Boys Town Algorithm',
      'id': 'afc',
      'cards': [
    {
      'name': 'Adaptive Feedback Cancelation',
      'inputs': [
        {'label': 'Enable (1=yes, 0=no)', 'type': 'int', 'value': 1},
        {'label': 'Filter Length (samples, 0-256)', 'type': 'int', 'value': 100},
        {'label': 'Adaptation Factor (mu, 0.0-1.0)', 'type': 'float', 'value': 0.00100},
        {'label': 'Smoothing Factor (rho, 0.0-1.0)', 'type': 'float', 'value': 0.90},
        {'label': 'Min Allowed Envelope (eps, 0-1.0)', 'type': 'float', 'value': 0.008},

      ],
      'submitButton': {'prefix': DATASTREAM_PREFIX_AFC}
    },
  ],
};

export const BOYSTOWN_PAGE_PLOT = {
      'title': 'Boys Town Algorithm',
      'cards': [
    {
      'name': 'Frequency v. Output Level',
      'plot':{}
    },
  ],
};



export const DEFAULT_CONFIG = {
  'icon': 'creare.png',
  'pages': [
    { 
      'title':'Global', 
      'cards':[
        {
          'name': 'Algorithm',
          'buttons': [
            {'label': '~A', 'cmd': 'd', 'id': 'algA', 'width': 4},
            {'label': '~B', 'id': 'algB', 'width': 3},
            {'label': '~C', 'cmd': 'c', 'id': 'algC', 'width': 4}
          ]
        },
        {
          'name': 'Other',
          'buttons': [
            {'label': '~-', 'cmd': '#', 'id': 'hi', 'width': 4},
            {'label': '~+', 'cmd': '3', 'id': 'rest', 'width': 7}
          ]
        }
      ]
    },
    { 
      'title':'Gain Settings', 
      'cards':[
        {
          'name': 'High Gain',
          'buttons': [
            {'label': '~-', 'cmd': '#', 'id': 'hi', 'width': 4},
            {'label': '~+', 'cmd': '3', 'id': 'rest', 'width': 7}
          ]
        },
        {
          'name': 'Mid Gain',
          'buttons': [
            {'label': '~-', 'cmd': '@', 'id': 'rest'},
            {'label': '~+', 'cmd': '2', 'id': 'rest'}
          ]
        },
        {
          'name': 'Low Gain',
          'buttons': [
            {'label': '~-', 'cmd': '!'},
            {'label': '~+', 'cmd': '1'}
          ]
        }
      ]
    }
  ],
  'prescription': {'type':'BoysTown','pages':['multiband','broadband','afc','plot']}
};

/*
const DEFAULT_CONFIG = {
  'icon':'tympan.png',
  'pages':[
    {'title':'Presets','cards':[
      {'name':'Record Mics to SD Card','buttons':[{'label': 'Start', 'cmd': 'r', 'id':'recordStart'},{'label': 'Stop', 'cmd': 's'}]}
    ]},
    {'title':'Tuner','cards':[
      {'name':'Select Input','buttons':[{'label': 'Headset Mics', 'cmd': 'W', 'id':'configHeadset'},{'label': 'PCB Mics', 'cmd': 'w', 'id': 'configPCB'}]},
      {'name':'Input Gain', 'buttons':[{'label': 'Less', 'cmd' :'I'},{'label': 'More', 'cmd': 'i'}]},
      {'name':'Record Mics to SD Card','buttons':[{'label': 'Start', 'cmd': 'r', 'id':'recordStart'},{'label': 'Stop', 'cmd': 's'}]},
      {'name':'CPU Reporting', 'buttons':[{'label': 'Start', 'cmd' :'c','id':'cpuStart'},{'label': 'Stop', 'cmd': 'C'}]}
    ]}                            
  ]
};
*/

export function numberAsCharStr(num: number, numType: string): string {
  let str = '';
  let hex = '';
  let BO: ByteOrder = ByteOrder.LSB;

  switch (numType) {
    case 'int':
    case 'int32':
      //str = num.toString();
      let byteArray = new Uint8Array(4);
      let rem = num;
      for (let i=3; i>=0; i--) {
        /* tslint:disable no-bitwise */
        byteArray[i] = rem & 0xFF;
        rem = rem >> 8;
        /* tslint:enable no-bitwise */
      }
      for (let i=0; i<4; i++) {
        str += String.fromCharCode(byteArray[i]);
        hex += ('00' + byteArray[i].toString(16)).slice(-2);
      }
      //console.log('int check: ' + num + ' => ' + str + '(' + hex + ')');
      break;
    case 'float': // float32
    case 'float32':
      let b2 = new Uint8Array(4);
      ieee754.write(b2,num,0,false,23,4);
      for (let i=0; i<4; i++) {
        str += String.fromCharCode(b2[i]);
        hex += ('00' + b2[i].toString(16)).slice(-2);
      }
      //console.log('ieee754 check: ' + num + ' => ' + str + '(' + hex + ')');
      break;
  }
  if (BO === ByteOrder.LSB) {
    return str.split('').reverse().join('');
  } else {
    return str;
  }
}

export function charStrToNumber(data: string, idx: number, numType: string): number {
  let dataLen = 0;
  let num = 0;
  let BO: ByteOrder = ByteOrder.LSB;

  let isLE = (BO === ByteOrder.LSB);

  switch (numType) {
    case 'int':
    case 'int32':
      dataLen = 4;
      num = 0;
      for (let i=idx+dataLen-1; i >= idx; i--) {
        /* tslint:disable no-bitwise */
        num = (num<<8) | data.charCodeAt(i);
        /* tslint:enable no-bitwise */
      }
      break;
    case 'float':
    case 'float32':
      dataLen = 4;
      let buf = new Uint8Array(dataLen);
      for (let i=0; i<dataLen; i++) {
        buf[i] = data.charCodeAt(idx+i);
      }
      num = ieee754.read(buf,0,isLE,23,4);
      break;
  }
  //console.log(`${num}`);
  return num;
}

export function isNumeric(s: string): boolean {
  const numerics = ['int', 'float'];
  return numerics.includes(s);
}




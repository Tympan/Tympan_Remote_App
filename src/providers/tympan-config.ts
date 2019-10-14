let ADD_BOYSTOWN_DSL: boolean = false;
let ADD_BOYSTOWN_WDRC: boolean = false;
let ADD_BOYSTOWN_AFC: boolean = false;
let ADD_BOYSTOWN_PLOT: boolean = false;


export interface iDevice {
  id: string;
  name: string;
  uuid?: string;
  class?: number;
  address?: string;
  rssi?: number;
  emulated?: boolean;
}

export const DEVICE_1: iDevice = {
  id: 'mo:ck:01',
  name: 'mock1',
  emulated: true,
};

export const DEVICE_2: iDevice = {
  id: 'mo:ck:02',
  name: 'mock2',
  emulated: true,
};

/* Some definitions that need to be the same in the app and in the Tympan code: */
export const DATASTREAM_START_CHAR = String.fromCharCode(0x02);
export const DATASTREAM_SEPARATOR = String.fromCharCode(0x03);
export const DATASTREAM_END_CHAR = String.fromCharCode(0x04);
export const DATASTREAM_PREFIX_GHA = 'gha';
export const DATASTREAM_PREFIX_DSL = 'dsl';
export const DATASTREAM_PREFIX_AFC = 'afc';

export const BUTTON_STYLE_ON = {color: 'success', isOn: true};
export const BUTTON_STYLE_OFF = {color: 'medium', isOn: false};

export const BOYSTOWN_PAGE_DSL = {
  'title': 'Boys Town Algorithm',
  'cards': [
    {
      'name': 'Multiband Compression',
      'inputs': [
        {'label': 'Attack (msec)', 'type': 'float', 'value': 30},
        {'label': 'Release (msec)', 'type': 'float', 'value': 300},
        {'label': 'Number of Channels (1-8)', 'type': 'int', 'value': 8, 'disabled': true},
        {'label': 'Output at Full Scale (db SPL)', 'type': 'float', 'value': 115},
        {'label': 'Band Data', 'type': 'grid', 'numRows': 8, 'indexLabel': 'Band', 'columns': [
                {'label': 'Crossover Frequency (Hz)', 'type': 'int', 'values': [0, 317, 503, 798, 1265, 2006, 3181, 5045]},
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
            {'label': '~A', 'cmd': 'd', 'id': 'algA'},
            {'label': '~B', 'cmd': 'D', 'id': 'algB'},
            {'label': '~C', 'cmd': 'c', 'id': 'algC'}
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
            {'label': '~-', 'cmd': '#', 'id': 'hi'},
            {'label': '~+', 'cmd': '3', 'id': 'rest'}
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


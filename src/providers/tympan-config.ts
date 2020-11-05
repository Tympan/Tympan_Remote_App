import ieee754 from 'ieee754';

enum ByteOrder {MSB, LSB}

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


/* Some definitions that need to be the same in the app and in the Tympan code: */
export const DATASTREAM_START_CHAR = String.fromCharCode(0x02);
export const DATASTREAM_SEPARATOR = String.fromCharCode(0x03);
export const DATASTREAM_END_CHAR = String.fromCharCode(0x04);
export const DATASTREAM_PREFIX_GHA = 'gha';
export const DATASTREAM_PREFIX_DSL = 'dsl';
export const DATASTREAM_PREFIX_AFC = 'afc';

/* Button styling: */
export const BUTTON_STYLE_ON = {color: 'success', isOn: true, class: 'btn-on'};
export const BUTTON_STYLE_OFF = {color: 'medium', isOn: false, class: 'btn-off'};
export const BUTTON_STYLE_NONE = {color: 'unset', isOn: undefined, class: 'btn-none'};


export const BOYSTOWN_PAGE_PLOT = {
  'title': 'Boys Town Algorithm',
  'cards': [
    {
      'name': 'Frequency v. Output Level',
      'plot':{}
    },
  ]
};

export const DEFAULT_CONFIG = {
  'icon': 'tympan.png',
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





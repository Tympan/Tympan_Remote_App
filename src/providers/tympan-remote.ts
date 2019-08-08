import { Injectable, NgZone } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { Logger } from './logger';
import ieee754 from 'ieee754';

interface iDevice {
  id: string;
  name: string;
  uuid?: string;
  class?: number;
  address?: string;
  rssi?: number;
  emulated?: boolean;
}

const DEVICE_1: iDevice = {
  id: 'mo:ck:01',
  name: 'mock1',
  emulated: true
};

const DEVICE_2: iDevice = {
  id: 'mo:ck:02',
  name: 'mock2',
  emulated: true
};

const BLUETOOTH:boolean = true;

enum ByteOrder {MSB, LSB};

const DATASTREAM_START_CHAR = String.fromCharCode(0x02);
const DATASTREAM_SEPARATOR = String.fromCharCode(0x03);
const DATASTREAM_END_CHAR = String.fromCharCode(0x04);

const BUTTON_STYLE_ON = {color: 'success', isOn: true};
const BUTTON_STYLE_OFF = {color: 'medium', isOn: false};

/*
const DEFAULT_CONFIG = {
  'icon': 'creare.png',
  'pages': [
    { 
      'title':'Presets', 
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
    },
    {
      'title': 'BoysTown Algorithm',
      'cards': [
        {
          'name': 'DSL',
          'inputs': [
            {'label': 'Attack', 'type': 'float', 'value': 30},
            {'label': 'Release', 'type': 'float', 'value': 300},
            {'label': 'maxdB', 'type': 'float', 'value': 115},
            {'label': 'speaker', 'type': 'int', 'value': 0},
            {'label': 'numChannels', 'type': 'int', 'value': 8, 'disabled': true},
            {'label': 'Band Data', 'type': 'grid', 'numRows': 8, 'indexLabel': 'Band', 'columns': [
                    {'label': 'Frequency', 'type': 'float', 'values': [0, 317.1666, 502.9734, 797.6319, 1264.9, 2005.9, 3181.1, 5044.7]},
                    {'label': 'Low SPL Compression Ratio', 'type': 'float', 'values': [0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57, 0.57]},
                    {'label': 'Compression Start Gain', 'type': 'float', 'values': [20., 20., 25., 30., 30., 30., 30., 30.]},
                    {'label': 'Compression Start Knee', 'type': 'float', 'values': [20., 20., 25., 30., 30., 30., 30., 30.]},
                    {'label': 'Compression Ratio', 'type': 'float', 'values': [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5]},
                    {'label': 'Expansion End Knee', 'type': 'float', 'values': [45.0, 45.0, 33.0, 32.0, 36.0, 34.0, 36.0, 40.0]},
                    {'label': 'Threshold', 'type': 'float', 'values': [90., 90., 90., 90., 90., 91., 92., 93.]},
            ]},
          ],      
          'submitButton': {'prefix': 'dsl'}
        },
        {
          'name': 'WDRC',
          'inputs': [
            {'label': 'Attack', 'type': 'float', 'value': 5},
            {'label': 'Release', 'type': 'float', 'value': 300},
            {'label': 'Sample Rate', 'type': 'float', 'value': 24000},
            {'label': 'maxdB', 'type': 'float', 'value': 115},
            {'label': 'Low SPL Compression Ratio', 'type': 'float', 'value': 1.0},
            {'label': 'Compression Start Gain', 'type': 'float', 'value': 0.},
            {'label': 'Compression Start Knee', 'type': 'float', 'value': 115.},
            {'label': 'Compression Ratio', 'type': 'float', 'value': 1.},
            {'label': 'Expansion End Knee', 'type': 'float', 'value': 0.0},
            {'label': 'Threshold', 'type': 'float', 'value': 98.0},
          ],
          'submitButton': {'prefix': 'wdrc'}
        },
      ],
    }
  ]
*/

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

/**
 * This class contains the variables and methods for the Tympan Remote app.
 */
@Injectable({
  providedIn: 'root'
})
export class TympanRemote {
  public btSerial: BluetoothSerial;
  public allDevices: iDevice[];
  public _activeDeviceId: string;
  private _config: any = {};
  public emulate: boolean = false;
  public connected: boolean = false;
  public btn: any = {};
  private _devIcon: string;
  public showLogs: boolean = false;

  get activeDevice() {
    if (this.connected) {
      let f = this.findDeviceWithId(this._activeDeviceId);
      return f;
    } else {
      return undefined;
    }
  }

  get activeDeviceId() {
    if (this.connected) {
      return this._activeDeviceId;
    } else {
      return '';
    }
  }

  get deviceIds(): string[] {
    // Should only return emulated devices if emulate
    let deviceIds: string[] = [];
    for (let dev of this.allDevices) {
      //this.logger.log(dev);
      if (dev.emulated && !this.emulate) {
        // do nothing
      } else {
        this.logger.log(`Pushing ${dev.id}`);
        deviceIds.push(dev.id);
      }
    }
    return deviceIds;
  }

  get devices(): any {
    return this.allDevices;
  }

  get pages() {
    return this._config.pages;
  }

  set pages(pages: any) {
    // Set styles for all buttons on pages:
    let btnStyle = {};
    for (let page of pages) {
      if (page.cards) {
        for (let card of page.cards) {
          if (card.buttons) {
            for (let button of card.buttons) {
              if (button.id) {
                btnStyle[button.id] = BUTTON_STYLE_OFF;
              } else {
                button['id'] = 'default';
                btnStyle['default'] = BUTTON_STYLE_OFF;
              }
            }            
          }
        }        
      }
    }
    // Create variables to control cycling through tables:
    for (let page of pages) {
      if (page.cards) {
        for (let card of page.cards) {
          if (card.inputs) {
            for (let input of card.inputs) {
              if (input.type==='grid') {
                input['rowNums'] = Array(input.numRows).fill(0).map((x,i)=>i);
                input['currentCol'] = 0;
              }
            }            
          }
        }        
      }
    }
    // Update the styles:
    this.zone.run(()=>{
      this._config.pages = pages;
      this.btn = btnStyle;      
    });
  }

  set devIcon(filename: string) {
    this.zone.run(()=>{
      this._devIcon = '/assets/devIcon/' + filename; 
    });
  }

  get devIcon(): string {
    return this._devIcon;
  } 

  set activeDeviceId(id: string) {
    this.zone.run(()=>{
      this._activeDeviceId = id;
    })
  }

  constructor(private zone: NgZone, private logger: Logger) {
    this.btSerial = new BluetoothSerial();
    this.allDevices = [];
    this.allDevices.push(DEVICE_1);
    this.allDevices.push(DEVICE_2);
    this.pages = DEFAULT_CONFIG.pages;
    this.devIcon = DEFAULT_CONFIG.icon;
    this.setActiveDevice(DEVICE_1.id);

    this.logger.log('hello');
    this.updateDeviceList();
  }

  public isActiveId(id: string) {
    return id == this._activeDeviceId;
  }

  public findDeviceWithId(id: string) {
    let device = this.allDevices.find((dev)=>{
      //this.logger.log(`Comparing ${id} with ${dev.id}`);
      return dev.id == id;
    });
    return device;
  }

  /*
   * Disconnect and delete any devices (useful for page reload or
   *  change in bluetooth config)
   */
  public reset() {
    // Should reset the bluetooth connection, disconnecting from any connected device.
  }

  public disconnect() {
    this._activeDeviceId = '';
    this.connected = false;
    this.pages = DEFAULT_CONFIG.pages;
    this.devIcon = DEFAULT_CONFIG.icon;
    if (BLUETOOTH) {
      this.btSerial.disconnect();
    }
  }

  public setActiveDevice(id: string) {

    this.logger.log(`remote.setActiveDevice: setting device with id ${id} as active.`);
    this.disconnect();
    let dev = this.findDeviceWithId(id);
    if (dev==null) {
      this.logger.log('Could not find device.');
      this._activeDeviceId = '';
      return;
    }
    if (dev.emulated) {
      this.activeDeviceId = id;
      this.connected = true;
    } else {
      this.logger.log(`setAD: connecting to ${dev.name} (${dev.id})`); //  `
      this.btSerial.connect(dev.id).subscribe(()=>{
        this.logger.log('CONNECTED');
        this.activeDeviceId = id;
        this.connected = true;
        this.subscribe();
        this.sayHello();
      },()=>{
        this.logger.log('CONNECTION FAIL');
        this.activeDeviceId = '';
        this.connected = false;
      });      
    }
  }

  public testFn() {
    /*
    this.btSerial.isEnabled().then(()=>{this.logger.log('Is Enabled.');},()=>{this.logger.log('Is Not Enabled.');});
    this.btSerial.isConnected().then(()=>{this.logger.log('Is Connected.');},()=>{this.logger.log('Is Not Connected.');});
    this.updateDeviceList();
    */
    //this.send(DATASTREAM_SEPARATOR);
    this.send(DATASTREAM_START_CHAR);
    this.send(this.numberAsCharStr(13,'int32'));
    this.send(DATASTREAM_SEPARATOR);
    this.send('test');
    this.send(DATASTREAM_SEPARATOR);
    this.send(this.numberAsCharStr(17501197,'int32'));
    this.send(this.numberAsCharStr(3.14,'float'));
    this.send(DATASTREAM_END_CHAR);
  }

  public subscribe() {
    this.btSerial.subscribe('\n').subscribe((data)=>{
      this.logger.log(`>${data}`);
      if (data.length>5 && data.slice(0,5)=='JSON=') {
        this.parseConfigStringFromDevice(data);
      } else if (data.length>6 && data.slice(0,6)=='STATE=') {
        this.parseStateStringFromDevice(data);
      }
    });
  }

  public parseConfigStringFromDevice(data: string) {
    this.logger.log('Found json config from arduino:');
    let cfgStr = data.slice(5).replace(/'/g,'"');
    this.logger.log(cfgStr);
    try {
      let cfgObj = JSON.parse(cfgStr);
      this.pages = cfgObj.pages;
      //this.pages = cfgObj.pages.concat(DEFAULT_CONFIG.pages);
      this.logger.log('Updating pages...');
      if (cfgObj.icon) {
        this.devIcon = cfgObj.icon;
      }
    } catch(err) {
      this.logger.log(`Invalid json string: ${err}`);
      for (let idx = 0; idx<cfgStr.length; idx=idx+20) {
        this.logger.log(`${idx}: ${cfgStr.slice(idx,idx+20)}`);
      }
    }
  }

  public parseStateStringFromDevice(data: string) {
    //this.logger.log('Found state string from arduino:');
    let stateStr = data.slice(6);
    //this.logger.log(stateStr);
    let parts = stateStr.split(':');
    let featType = parts[0];
    let id = parts[1];
    let val = parts[2];
    /* We're splitting on ":", but maybe the user wanted to display a message that included a colon? */
    for (let idx = 3; idx<featType.length; idx++) {
      val += ':';
      val += parts[idx];
    }
    this.zone.run(()=>{
      try {
        switch (featType) {
          case 'BTN':
            if (val[0]==='0') {
              this.btn[id] = BUTTON_STYLE_OFF;
            } else if (val[0]==='1') {
              this.btn[id] = BUTTON_STYLE_ON;
            } else {
              throw 'Button state must be 0 or 1';
            }
            break;
          case 'SLI':
            break;
          case 'NUM':
            break;
          case 'TXT':
            break;
        }
        //this.logger.log('Updating pages...');
      }
      catch(err) {
        this.logger.log(`Invalid state string: ${err}`);
      }      
    });
  }

  public sayHello() {    
    this.send('h');
    this.send('J');
  }

  public async updateDeviceList () {
    this.logger.log('Getting device list:');
    if (BLUETOOTH) {
      this.btSerial.list().then((devices)=>{
        this.allDevices = [];
        for (let idx = 0; idx<devices.length; idx++) {
          let device = devices[idx];
          this.logger.log(`Found device ${device.name}`);
          //if (!this.allDevices[device.id]) {
            device.emulated = false;
            this.allDevices.push(device);
          //}
        }
      },()=>{
        this.logger.log(`failed to get device list`);
      });
    }
  }

  public send(s: string) {
    if (BLUETOOTH) {
      this.logger.log(`Sending ${s} to ${this.activeDevice.name}`);  
      this.btSerial.write(s).then(()=>{
        //this.logger.log(`Successfully sent ${s}`);
      }).catch(()=>{
        this.logger.log(`Failed to send ${s}`);
      });
    } else {
      this.logger.log('INACTIVE.  SEND FAIL.');
    }
  }

  public sendInputCard(card: any) {
    console.log('sending...');
    console.log(card);

    let dataStr = card.submitButton.prefix + DATASTREAM_SEPARATOR;
    for (let input of card.inputs) {
      if (this.isNumeric(input.type)) {
        dataStr += this.numberAsCharStr(input.value, input.type);
        //dataStr += ',';
      } else if (input.type ==='grid') {
        for (let col of input.columns) {
          //dataStr += '[';
          for (let value of col.values) {
            dataStr += this.numberAsCharStr(value, col.type);
            //dataStr += ',';
          }
          //dataStr += '],';
        } 
      }
    }

    this.logger.log("Sending " + DATASTREAM_START_CHAR + ", length = " + dataStr.length.toString());

    let charStr = DATASTREAM_START_CHAR + this.numberAsCharStr(dataStr.length,'int32') + DATASTREAM_SEPARATOR + dataStr + DATASTREAM_END_CHAR;

    if (BLUETOOTH) {
      this.btSerial.write(charStr).then(()=>{
        //this.logger.log(`Successfully sent ${charStr}`);
      }).catch(()=>{
        this.logger.log(`Failed to send ${charStr}`);
      });
    } else {
      this.logger.log('INACTIVE.  SEND FAIL.');
    }

    this.logger.log("Sending " + DATASTREAM_START_CHAR + ", length = " + dataStr.length.toString());

  }

  public numberAsCharStr(num: number, numType: string) {
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
        //for (let i=0; i<4; i++) {
          byteArray[i] = rem & 0xFF;
          rem = rem >> 8;
        }
        for (let i=0; i<4; i++) {        
          str += String.fromCharCode(byteArray[i]);
          hex += ('00' + byteArray[i].toString(16)).slice(-2);
        }
        this.logger.log('int check: ' + num + ' => ' + str + '(' + hex + ')');          
        break;
      case 'float': // float32
      case 'float32':
        let b2 = new Uint8Array(4);
        ieee754.write(b2,num,0,false,23,4);
        for (let i=0; i<4; i++) {
          str += String.fromCharCode(b2[i]);
          hex += ('00' + b2[i].toString(16)).slice(-2);
        }
        this.logger.log('ieee754 check: ' + num + ' => ' + str + '(' + hex + ')');
        break;
    }
    if (BO == ByteOrder.LSB) {
      return str.split('').reverse().join('');
    } else {
      return str;
    }
  };

  public isNumeric(s: string) {
    const numerics = ['int', 'float'];
    return numerics.includes(s);
  }

}



import { Injectable, NgZone } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { Logger } from './logger';

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

const BUTTON_STYLE_ON = {color: 'success', isOn: true};
const BUTTON_STYLE_OFF = {color: 'medium', isOn: false};

const DEFAULT_PAGES = [
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
      },
      {
        'name': 'Alg2',
        'buttons': [
          {'label': '~E', 'cmd': 'd', 'id': 'algE'},
          {'label': '~F', 'cmd': 'D', 'id': 'algF'},
          {'label': '~G', 'cmd': 'c', 'id': 'algG'}
        ]
      }
    ]
  },
  { 
    'title':'Presets', 
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
];

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
  private _pages: any = {};
  public emulate: boolean = false;
  public connected: boolean = false;
  public btn: any = {};

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
    return this._pages;
  }

  set pages(pages: any) {
    let btnStyle = {};
    for (let page of pages) {
      for (let card of page.cards) {
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
    this._pages = pages;
    this.btn = btnStyle;
  }

  constructor(private zone: NgZone, private logger: Logger) {
    this.btSerial = new BluetoothSerial();
    this.allDevices = [];
    this.allDevices.push(DEVICE_1);
    this.allDevices.push(DEVICE_2);
    this.pages = DEFAULT_PAGES;
    this.setActiveDevice(DEVICE_1.id);

    this.logger.log('hello');
    this.updateDeviceList();
  }

  public isActiveId(id: string) {
    return id == this._activeDeviceId;
  }

  public findDeviceWithId(id: string) {
    let device = this.allDevices.find((dev)=>{
      this.logger.log(`Comparing ${id} with ${dev.id}`);
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
    this.pages = DEFAULT_PAGES;
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
      this._activeDeviceId = id;
      this.connected = true;
    } else {
      this.logger.log(`setAD: connecting to ${dev.name} (${dev.id})`); //  `
      this.btSerial.connect(dev.id).subscribe(()=>{
        this.logger.log('CONNECTED');
        this._activeDeviceId = id;
        this.connected = true;
        this.subscribe();
        this.sayHello();
      },()=>{
        this.logger.log('CONNECTION FAIL');
        this._activeDeviceId = '';
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
      this.logger.log('Updating pages...');
    }
    catch(err) {
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
}



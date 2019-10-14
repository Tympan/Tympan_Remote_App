import { Injectable, NgZone } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { Logger } from './logger';
import ieee754 from 'ieee754';

import {
  iDevice,
  DEVICE_1,
  DEVICE_2,
  DATASTREAM_START_CHAR,
  DATASTREAM_SEPARATOR,
  DATASTREAM_END_CHAR,
  DATASTREAM_PREFIX_GHA,
  DATASTREAM_PREFIX_DSL,
  DATASTREAM_PREFIX_AFC,
  BUTTON_STYLE_ON,
  BUTTON_STYLE_OFF,
  BOYSTOWN_PAGE_DSL,
  BOYSTOWN_PAGE_WDRC,
  BOYSTOWN_PAGE_AFC,
  BOYSTOWN_PAGE_PLOT,
  DEFAULT_CONFIG,
} from './tympan-config';

export enum BluetoothType {BLUETOOTH_SERIAL, BLE};

const BLUETOOTH:boolean = true;

enum ByteOrder {MSB, LSB};

let ADD_BOYSTOWN_DSL: boolean = false;
let ADD_BOYSTOWN_WDRC: boolean = false;
let ADD_BOYSTOWN_AFC: boolean = false;
let ADD_BOYSTOWN_PLOT: boolean = false;

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
  public showDevOptions: boolean = false;
  public showSerialMonitorPage: boolean = false;
  
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
    // Add the Boystown page?
    // if (ADD_BOYSTOWN) {
    //   pages = pages.concat(BOYSTOWN_PAGE);
    // }

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

  set prescriptionPages(presc: any) {
    this.zone.run(()=>{
        this._config.prescription = presc;
    });
  }

  get prescriptionPages() {
    let pages = [];
    if (this._config.prescription && this._config.prescription.type == 'BoysTown') {
        for (let pageName of this._config.prescription.pages) {
            console.log(pageName);
            switch (pageName) {
                case 'multiband': {
                    console.log('mb');
                    pages.push(BOYSTOWN_PAGE_DSL);
                    break;
                }
                case 'broadband': {
                    console.log('bb');
                    pages.push(BOYSTOWN_PAGE_WDRC);
                    break;
                }
                case 'afc': {
                    console.log('afc');
                    pages.push(BOYSTOWN_PAGE_AFC);
                    break;
                }
                case 'plot': {
                    console.log('plot');
                    pages.push(BOYSTOWN_PAGE_PLOT);
                    break;
                }
            }
        }
    } else {
        pages = [{
            'title':'prescriptions',
            'cards':[{'name': 'No Prescription', 'buttons': []}]
        }];
    }
    console.log("returning these pages:");
    console.log(pages);

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
    //console.log(this._config.pages);
    //pages = pages.concat(this._config.pages);
    //console.log(pages);
    return pages; //this._config.pages;
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
    this.prescriptionPages = DEFAULT_CONFIG.prescription;
    this.devIcon = DEFAULT_CONFIG.icon;
    this.setActiveDevice(DEVICE_1.id);

    this.logger.log('hello');
    for (let i=0; i<300; i++) {
        this.logger.log('Log number '+i);
    }
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

  public showMocks() {
    DEVICE_1.emulated = true;
    DEVICE_2.emulated = true;
    this.setActiveDevice(DEVICE_1.id);
    this.updateDeviceList();
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

  public toggleState(id){
    id=!id
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
    this.allDevices = [];
    if (BLUETOOTH) {
      this.btSerial.list().then((devices)=>{
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

  // public addBoysTownPage(ADD_BOYSTOWN_DSL) {
  //   if (ADD_BOYSTOWN_DSL === false) {
  //     ADD_BOYSTOWN_DSL = true;
  //     this.pages = this.pages.concat(BOYSTOWN_PAGE_DSL); 
  //   }
  //   if (ADD_BOYSTOWN_WDRC === false) {
  //     ADD_BOYSTOWN_WDRC = true;
  //     this.pages = this.pages.concat(BOYSTOWN_PAGE_DSL, BOYSTOWN_PAGE_WDRC, BOYSTOWN_PAGE_PLOT); 
  //   }
  // }  

  // public removeBoysTownPage() {
  //   if (ADD_BOYSTOWN_DSL) {
  //     ADD_BOYSTOWN_DSL = false;
  //     this.pages = DEFAULT_CONFIG.pages;
  //   }
  //   if (ADD_BOYSTOWN_WDRC) {
  //     ADD_BOYSTOWN_WDRC = false;
  //     this.pages = DEFAULT_CONFIG.pages;
  //   }
  // }    

  public setUpPages() {
    // let defaultConnectedPages = [this.pages[0], this.pages[1], this.pages[2]];
    // this.pages = defaultConnectedPages;
    // this.pages = DEFAULT_CONFIG.pages;
    let pagesToAdd = [];
    for (var page of this.pages) {
      for (var card of page.cards) {
        for (var tog in card.toggles) {
          if (card.toggles[tog].id != false){
            if (!this.pages.includes(card.toggles[tog].pagename)){
              pagesToAdd.push(card.toggles[tog].pagename)
            }
            card.toggles[tog].id = true;
          }
          else if (this.pages.includes(card.toggles[tog].pagename)){
            let ind = this.pages.indexOf(card.toggles[tog].pagename);
            this.pages.splice(ind)
          }
        }
      }
    }
    this.pages = this.pages.concat(pagesToAdd)  
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
      this.logger.log('BLUETOOTH INACTIVE.  SEND FAIL.');
    }
  }

  public formatData(){
    var card = BOYSTOWN_PAGE_DSL.cards[0]
    let TKGainData = [];
    let TKData = [];
    let BOLTData = [];
    var val;
    var xval;
    var yval1;
    var yval2;
    var yval3;
    var graphData;
    console.log(card.inputs[4])
    for (val in card.inputs[4].columns[0].values){
      xval = card.inputs[4].columns[0].values[val]
      yval1 = card.inputs[4].columns[3].values[val]
      TKGainData.push({x: xval, y: yval1})

      xval = card.inputs[4].columns[0].values[val]
      yval2 = card.inputs[4].columns[2].values[val]
      TKData.push({x: xval, y: yval2})

      xval = card.inputs[4].columns[0].values[val]
      yval3 = card.inputs[4].columns[6].values[val]
      BOLTData.push({x: xval, y: yval3})
    }
    TKGainData.push({x: 12000, y: yval1})
    TKData.push({x: 12000, y: yval2})
    BOLTData.push({x: 12000, y: yval3})

    graphData = [TKGainData, TKData, BOLTData];
    return graphData;
 }

// public formatData(){
//   var card = BOYSTOWN_PAGE_DSL.cards[0]
//   let TKGainData = [];
//   let TKData = [];
//   let BOLTData = [];
//   let xData = []
//   var val;
//   var xval;
//   var yval1;
//   var yval2;
//   var yval3;
//   var Data;
//   for (val in card.inputs[4].columns[0].values){
//     yval1 = card.inputs[4].columns[3].values[val]
//     TKGainData.push(yval1)

//     yval2 = card.inputs[4].columns[2].values[val]
//     TKData.push(yval2)

//     yval3 = card.inputs[4].columns[6].values[val]
//     BOLTData.push(yval3)

//     xval = card.inputs[4].columns[0].values[val]
//     xData.push(xval)
//   }
//     TKGainData.push({x: 12000, y: yval1})
//     TKData.push({x: 12000, y: yval2})
//     BOLTData.push({x: 12000, y: yval3})
//   Data = [TKGainData, TKData, BOLTData, xData];
//   console.log(Data)
//   return Data;
// }

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



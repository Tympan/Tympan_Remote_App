import { Injectable, NgZone } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { BLE } from '@ionic-native/ble/ngx';
import ieee754 from 'ieee754';
import { Logger } from './logger';
import { Plotter } from './plotter';
import { TympanRemote} from './tympan-remote';

//import { BluetoothType } from './tympan-remote'; 

import {
  DSL,
  WDRC,
  AFC
} from './prescriptions';

import {
  DATASTREAM_START_CHAR,
  DATASTREAM_SEPARATOR,
  DATASTREAM_END_CHAR,
  BUTTON_STYLE_ON,
  BUTTON_STYLE_OFF,
  BUTTON_STYLE_NONE,
  BOYSTOWN_PAGE_PLOT,
  DEFAULT_CONFIG,
  charStrToNumber,
  isNumeric
} from './tympan-config';

/**
 * This interface contains the information that needs to be provided
 * to construct an instance of the TympanDevice class.
 */
export interface TympanDeviceConfig {
  id: string;
  name: string;
  status?: string;
  uuid?: string;
  address?: string;
  rssi?: number;
  emulated: boolean;
  parent: TympanRemote;
}

export interface TympanBTSerialConfig extends TympanDeviceConfig {
  bluetoothClass?: number;
}

export interface TympanBLEConfig extends TympanDeviceConfig {
}

/**
 * This class contains the variables and methods for the Tympan Remote app.
 */
export abstract class TympanDevice {  
  public id: string;
  public name: string;
  public status: string;
  public uuid?: string;
  public class?: number;
  public address?: string;
  public rssi?: number;
  public emulated: boolean;
  public _config: any;
  private parent: TympanRemote;

  public plotter: Plotter;
  public logger: Logger;
  private zone: NgZone
  //public btType: BluetoothType;

  constructor(dev: any) {
    this.id = dev.id;
    this.name = dev.name;
    this.emulated = dev.emulated;
    this.status = '';
    this._config = {};
    //this.btType = dev.btType;
  }

  public interpretDataFromDevice(data: string) {
    //this.logger.log(`>${data}`);
    if (data.length>5 && data.slice(0,5)=='JSON=') {
      this.parseConfigStringFromDevice(data);
    } else if (data.length>6 && data.slice(0,6)=='STATE=') {
      this.parseStateStringFromDevice(data);
    } else if (data.length>5 && data.slice(0,5)=='TEXT=') {
      this.parseTextStringFromDevice(data);
    } else if (data.length>6 && data.slice(0,6)=='PRESC=') {
      this.parsePrescriptionStringFromDevice(data);
    } else if (data.length>1 && data.slice(0,1)=='P') {
      this.parsePlotterStringFromDevice(data);
    }
  }

  public parsePlotterStringFromDevice(data: string) {
    //this.logger.log('Found serial plotting data from arduino:');
    this.plotter.parsePlotterStringFromDevice(data);
  }

  public parseConfigStringFromDevice(data: string) {
    this.logger.log('Found json config from arduino:');
    let cfgStr = data.slice(5).replace(/'/g,'"');
    this.logger.log(cfgStr);
    try {
      let cfgObj = JSON.parse(cfgStr);
      this.setConfig(cfgObj);
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
    for (let idx = 3; idx<parts.length; idx++) {
      val += ':';
      val += parts[idx];
    }
    this.zone.run(()=>{
      try {
        switch (featType) {
          case 'BTN':
            if (val[0]==='0') {
              this.parent.adjustComponentById(id,'style',BUTTON_STYLE_OFF);
            } else if (val[0]==='1') {
              this.parent.adjustComponentById(id,'style',BUTTON_STYLE_ON);
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

  public parseTextStringFromDevice(data: string) {
    //this.logger.log('Found state string from arduino:');
    let textStr = data.slice(5);
    //this.logger.log(stateStr);
    let parts = textStr.split(':');
    let featType = parts[0];
    let id = parts[1];
    let val = parts[2];
    /* We're splitting on ":", but maybe the user wanted to display a message that included a colon? */
    for (let idx = 3; idx<parts.length; idx++) {
      val += ':';
      val += parts[idx];
    }
    this.zone.run(()=>{
      try {
        this.parent.adjustComponentById(id,'label',val);
        //this.logger.log('Updating pages...');
      }
      catch(err) {
        this.logger.log(`Invalid text string: ${err}`);
      }      
    });
  }

  public parsePrescriptionStringFromDevice(data: string) {
    //this.logger.log('Found state string from arduino:');
    let prescStr = data.slice(6);
    //this.logger.log(prescStr);
    let parts = prescStr.split(':');
    let prescType = parts[0];
    let val = parts[1];
    /* We're splitting on ":", but maybe the user wanted to display a message that included a colon? */
    for (let idx = 2; idx<parts.length; idx++) {
      val += ':';
      val += parts[idx];
    }
    this.logger.log(`Parsing ${prescType} prescription.`);

    this.zone.run(()=>{
      try {
        switch (prescType) {
          case 'DSL': 
            {
              let dsl = new DSL();
              dsl.fromDataStream(val);
              let updatedPage = dsl.asPage();
              this.initializePages([updatedPage]);
              for (let pageNo in this._config.prescription.pages) {
                let page = this._config.prescription.pages[pageNo];
                if (page.id === 'dsl') {
                  this._config.prescription.pages[pageNo] = updatedPage;
                }
              }
            }
            break;
          case 'AFC': 
            {
              let afc = new AFC();
              afc.fromDataStream(val);
              let updatedPage = afc.asPage();
              this.initializePages([updatedPage]);
              for (let pageNo in this._config.prescription.pages) {
                let page = this._config.prescription.pages[pageNo];
                if (page.id === 'afc') {
                  this._config.prescription.pages[pageNo] = updatedPage;
                }
              }
            }
            break;
          case 'GHA': 
            {
              let gha = new WDRC();
              gha.fromDataStream(val);
              let updatedPage = gha.asPage();
              this.initializePages([updatedPage]);
              for (let pageNo in this._config.prescription.pages) {
                let page = this._config.prescription.pages[pageNo];
                if (page.id === 'gha') {
                  this._config.prescription.pages[pageNo] = updatedPage;
                }
              }
            }
            break;
        }
      }
      catch(err) {
        this.logger.log(`Invalid state string: ${err}`);
      }      
    });
  }

  public sayHello() {    
    //this.send('J');
  }

  public setConfig(cfgObj: any) {

    let newConfig = {};

    if (cfgObj.icon) {
      newConfig['devIcon'] = '/assets/devIcon/' + cfgObj.icon;
    } else {
      newConfig['devIcon'] = '/assets/devIcon/tympan.png';
    }
    if (cfgObj.pages) {
      this.initializePages(cfgObj.pages);
    }
    if (cfgObj.prescription) {
      newConfig['prescription'] = cfgObj.prescription;
      newConfig['prescription'].pages = cfgObj.pages.concat(this.buildPrescriptionPages(cfgObj.prescription));
    } else {
      newConfig['prescription'] = {};
      newConfig['prescription'].pages = cfgObj.pages;
    }

    this.zone.run(()=>{
      this._config = newConfig;
      //this.btn = btnStyle;      
    });   
  }

  public buildPrescriptionPages(presc: any): any {

    let pages = [];

    if (presc && presc.type == 'BoysTown') {
      for (let pageName of presc.pages) {
        console.log(pageName);
        switch (pageName) {
          case 'multiband': {
            pages.push(new DSL().asPage());
            break;
          }
          case 'broadband': {
            pages.push(new WDRC().asPage());
            break;
          }
          case 'afc': {
            pages.push(new AFC().asPage());
            break;
          }
          case 'plot': {
            pages.push(BOYSTOWN_PAGE_PLOT);
            break;
          }
          case 'serialMonitor': {
            this.parent.showSerialMonitor = true;
            break;
          }
          case 'serialPlotter': {
            this.parent.showSerialPlotter = true;
          }
        }
      }
    } else {
      pages = [{
        'title':'prescriptions',
        'cards':[{'name': 'No Prescription', 'buttons': []}]
      }];
    }

    this.initializePages(pages);
    return pages;
  }

  public initializePages(pages: any) {
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
          if (card.buttons) {
            for (let button of card.buttons) {
              if (!button.cmd) {
                button.style = BUTTON_STYLE_NONE;
              } else {
                button.style = BUTTON_STYLE_OFF;
              }
            }            
          }
        }        
      }

}


/******************************************************************
 * HELPER FUNCTIONS 
 ******************************************************************
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

export function str2ab(str) {
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
    }
    case 'int32':
  }
}

export class TympanBTSerial extends TympanDevice {
  constructor(dev: TympanBTSerialConfig) {
    super(dev as TympanDeviceConfig);
  }
}

export class TympanBLE extends TympanDevice {
  constructor(dev: TympanBLEConfig) {
    super(dev as TympanDeviceConfig);
  }
}

import { Injectable, NgZone } from '@angular/core';
import { BLE } from '@ionic-native/ble/ngx';
import ieee754 from 'ieee754';
import { Logger } from './logger';
import { Plotter } from './plotter';
import { ToastManager } from './toast-manager';
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
  BLE_MAX_TRANSMISSION_LENGTH,
  BLE_HEADERPACKET_PREFIX,
  BLE_PAYLOADPACKET_PREFIX_HIGHNIBBLE,
  BLE_SHORTPACKET_PREFIX_BYTE,
  BUTTON_STYLE_ON,
  BUTTON_STYLE_OFF,
  BUTTON_STYLE_NONE,
  BOYSTOWN_PAGE_PLOT,
  DEFAULT_CONFIG,
  ADAFRUIT_SERVICE_UUID,
  ADAFRUIT_CHARACTERISTIC_UUID,
} from './tympan-config';

export enum ByteOrder { MSB, LSB }
export enum TympanDeviceState { AVAILABLE, UNAVAILABLE, PENDING }

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
  emulatedProperties?: any;
  parent: TympanRemote;
}

export interface TympanBTSerialConfig extends TympanDeviceConfig {
  bluetoothClass?: number;
}

export interface TympanBLEConfig extends TympanDeviceConfig {
}

/**
 * Class TympanDevice
 * This class contains the variables and methods for the Tympan Remote app.
 */
export abstract class TympanDevice {  
  public id: string;
  public name: string;
  public uuid?: string;
  public class?: number;
  public address?: string;
  public rssi?: number;
  public emulated: boolean;
  protected emulatedProperties: any; // The "memory" on the emulated Tympan device
  public state: TympanDeviceState;
  public status: string;
  protected _config: any;
  protected parent: TympanRemote;
  protected notifyOnDisconnect: (TympanDevice, boolean)=>void;

  protected plotter: Plotter;
  protected logger: Logger;
  protected zone: NgZone;
  protected TRToast: ToastManager;
  
  //public btType: BluetoothType;

  constructor(dev: any) {
    this.id = dev.id;
    this.name = dev.name;
    this.emulated = dev.emulated;
    this.status = '';
    this._config = {};
    this.state = TympanDeviceState.PENDING;

    this.plotter = dev.parent.plotter;
    this.logger = dev.parent.logger;
    this.zone = dev.parent.zone;
    this.TRToast = dev.parent.TRToast;
    this.parent = dev.parent;
    //this.btType = dev.btType;
    this.emulatedProperties = dev.emulatedProperties; 
  }

  /* Public getters: */
  get prescriptionPages() {
    if (this._config && this._config.prescription) {
      return this._config.prescription.pages;
    } else {
      return undefined;
    }
  }

  get devIcon(): string {
    if (this._config) {
      return this._config.devIcon;
    } else {
      return undefined;
    }
  }

  /* The abstract functions that all extended classes must implement: */
  public abstract connect(TRonDisconnect: (TympanDevice, boolean)=>void): Promise<any>;

  public abstract disconnect();

  public abstract write(msg: string);

  /* Common protected functions that can be used by extended classes: */

  /**
   * interpretDataFromDevice: Take a "message" that came from the Tympan
   * (after it has been unpacked/reassembled from the BLE packets) and do
   * something with it.  Note that a many messages can be combined into a 
   * single longer message using the DATASTREAM_SEPARATOR as a separation
   * character, so in this function we first split the string on that char
   * before passing it along to the interpreter.
   * 
   * @param data The string "message" 
   */
  protected interpretDataFromDevice(data: string) {
    let separator_loc = data.indexOf(DATASTREAM_SEPARATOR);
    if (separator_loc<0) {
      this.interpretSingleMessageFromDevice(data);
    } else {
      let first_msg = data.slice(0,separator_loc);
      this.interpretSingleMessageFromDevice(first_msg);
      this.interpretDataFromDevice(data.slice(separator_loc+1));
    }
  }

  /**
   * Parse a single string "message".  This message shouldn't be multiple
   * messages glued together with the interstitial DATASTREAM_SEPARATOR char.
   * 
   * @param data The string message
   */
  protected interpretSingleMessageFromDevice(data:string) {
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
    } else if (data.length>4 && data.slice(0,4)=='LOG=') {
      this.logger.log(data.slice(4));
    }
  }

  protected parsePlotterStringFromDevice(data: string) {
    //this.logger.log('Found serial plotting data from arduino:');
    this.plotter.parsePlotterStringFromDevice(data);
  }

  protected parseConfigStringFromDevice(data: string) {
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
      this.TRToast.presentToast('Improper JSON config string.',3000);
    }
    this.setStatus('connected');
  }

  protected parseStateStringFromDevice(data: string) {
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
              this.adjustComponentById(id,'style',BUTTON_STYLE_OFF);
            } else if (val[0]==='1') {
              this.adjustComponentById(id,'style',BUTTON_STYLE_ON);
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

  protected parseTextStringFromDevice(data: string) {
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
        this.adjustComponentById(id,'label',val);
        //this.logger.log('Updating pages...');
      }
      catch(err) {
        this.logger.log(`Invalid text string: ${err}`);
      }      
    });
  }

  protected parsePrescriptionStringFromDevice(data: string) {
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

  protected setConfig(cfgObj: any) {

    let newConfig = {};

    if (cfgObj.icon) {
      newConfig['devIcon'] = '/assets/devIcon/' + cfgObj.icon;
    } else {
      newConfig['devIcon'] = '/assets/devIcon/tympan.png';
    }
    if (cfgObj.pages) {
      this.initializePages(cfgObj.pages);
    } else {
      cfgObj.pages = [];
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

  public setStatus(str: string) {
    this.zone.run(()=>{
      this.status = str;
    });
  }

  protected buildPrescriptionPages(presc: any): any {

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

  protected initializePages(pages: any) {
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
  }

  protected adjustComponentById(id: string, field: string, property: any) {
    let adjustableFields = ['label', 'style'];
    if (!adjustableFields.includes(field)) {
      this.logger.log(`Cannot set the ${field} of ${id}: invalid field.`);
      return;
    }
    for (let page of this._config.prescription.pages) {
      if (page.cards) {
        for (let card of page.cards) {
          if (card.buttons) {
            for (let btn of card.buttons) {
              if (btn.id == id) {
                btn[field] = property;
              }
            }
          }
        }
      }
    }
  }

  /*
   * Emualte a the behavior of a Tympan when it receives a message:
   */
  protected emulateTympanHandlingMessage(msg: string) {
    console.log(`Mock Tympan received message (length=${msg.length}):`+msg+'(EOM)')
    switch (msg) {
      case 'J':
        let cfg = this.emulatedProperties && this.emulatedProperties.config ? this.emulatedProperties.config : DEFAULT_CONFIG;
        this.emulateTympanSendingMessage('JSON='+JSON.stringify(cfg).replace(/"/g,"'"));
        break;
      case 'H':
        this.emulateTympanSendingMessage('LOG=Testing123456789abcdefg.');
        break;
      case 'L':
        this.emulateTympanSendingMessage('LOG=T12');
        break;
        case 's':
          this.emulateTympanSendingMessage('LOG=T12'+DATASTREAM_SEPARATOR+'LOG=yes');
          break;
      }
  }

  /* 
   * Emulate a message coming back to the app, in whatever form it arrives (arraybuffer packets, etc) 
   */
  protected abstract emulateTympanSendingMessage(msg: string);

}

/***************************************************************
*
* TYMPAN SERIAL
*
****************************************************************/
/**
 * Class TympanBTSerial
 * A Class extending TympanDevice for devices using Bluetooth Serial communication.
 */
export class TympanBTSerial extends TympanDevice {
  constructor(dev: TympanBTSerialConfig) {
    super(dev as TympanDeviceConfig);
  }

  public connect(TRonDisconnect: (TympanDevice, boolean)=>void): Promise<any> {
    return Promise.reject('No BT Serial implemented.');
  }

  public disconnect() {};

  public write(msg: string) {}

  protected emulateTympanSendingMessage(msg: string) {}

}

/***************************************************************
*
* TYMPAN BLE
*
****************************************************************/
interface iMessage { msg: string, msgLen: number, packetsReceived: number }
/**
 * Class TympanBLE
 * A Class extending TympanDevice for devices using Bluetooth Low Energy communication.
 */
export class TympanBLE extends TympanDevice {
  public ble: BLE;
  private incomingMessage: iMessage | null;

  constructor(dev: TympanBLEConfig) {
    super(dev as TympanDeviceConfig);
    this.ble = dev.parent.ble;
    this.incomingMessage = null;
  }

  public connect(TRonDisconnect: (TympanDevice, boolean)=>void): Promise<any> {
    const CONNECTION_TIMEOUT_MS = 10000;

    this.setStatus('Connecting...');
    this.notifyOnDisconnect = TRonDisconnect;

    if (this.emulated) {
      this.onConnect();
      return Promise.resolve();
    }

    return new Promise((resolve,reject)=>{
      // First, start a timeout to see if the connection attempt hangs up
      // (android waits 20 seconds before killing a connection attempt, whereas iOS will never kill it and will hang forever.
      let connectionTimeout = setTimeout(()=>{
        this.logger.log('Connection attempt is taking too long; killing.');
        this.ble.disconnect(this.id).then(()=>{
          let msg = 'FORCE disconnected SUCCESS';
          reject(new Error(msg));
        }).catch(()=>{
          let msg = 'FORCE disconnected FAIL'
          reject(new Error(msg));
        }).finally(()=>{
          this.setStatus('');
        });
      }, CONNECTION_TIMEOUT_MS);

      // Try to connect.
      try {
        this.logger.log(`Attempting to connect to ${this.name}`);  //`
        var thisDev = this;
        // Define the function that happens on a successful connect; end by resolving the promise.
        let connectFn = function() {
          clearTimeout(connectionTimeout);
          thisDev.onConnect().then(()=>{
            resolve('Successfully connected...##');
          });
        };
        let disconnectFn = function() {
          thisDev.onDisconnect(false);
        }
        this.ble.connect(this.id).subscribe(connectFn, disconnectFn);
      } catch {
        let msg = `Could not connect to ${this.id}`;
        this.setStatus('');
        this.logger.log(msg);
        reject(msg);
      }
    });
  }

  public disconnect() {
    let appInitiated = true;
    if (this.emulated) {
      this.onDisconnect(appInitiated);
    } else {
      this.ble.disconnect(this.id)
      .then(()=>{
        this.onDisconnect(appInitiated);
      });  
    }
  }

  /**
   * onConnect():
   * This function is called when the device has been connected.
   */
  public onConnect(): Promise<any> {
    this.logger.log(`Connected to ${this.name}`);
    this.setStatus('Connected');

    // Subscribe to the device
    if (!this.emulated) {
      this.ble.startNotification(this.id, ADAFRUIT_SERVICE_UUID, ADAFRUIT_CHARACTERISTIC_UUID)
      .subscribe((data)=>{
        this.bufferHandler(data);
      });  
    }

    // Ask the device to describe its pages:
    let msg = 'J';
    return this.write(msg);
  }

  /**
   * onDisconnect():
   * This function is called when the device has been disconnected.
   * The disconnection could be initiated by the app, or it could be
   * due to a dropped connection.  Since the behavior can be different
   * if the disconnection is app-initiated or device-initiated, the variable
   * 'appInitiated' should be passed to this function.
   */
  public onDisconnect(appInitiated=true) {
    this.logger.log(`Disconnected from ${this.name}`);
    this.setStatus('');
    if (this.notifyOnDisconnect !== undefined) {
      this.notifyOnDisconnect(this,appInitiated);
    }
  }

  public write(msg: string): Promise<any> {
    if (this.emulated) {
      /* For now we're going to bypass the breaking down of messages into smaller
       * bits and then reassembling them in memory.
       * If we wanted to do that later, we'd have to write a "emulateBLEDataTransmissionFromApp"
       * which would generate the bits of the message and then call "emulateBLEDataReceptionByTympan"
       * which would handle the bits of the message, string them together, and pass it to 
       * "emulateTympanHandlingMessage".
       */
      this.emulateTympanHandlingMessage(msg);
      return Promise.resolve();
    } else {
      let ab = stringToArrayBuffer(msg);
      return this.ble.write(this.id, ADAFRUIT_SERVICE_UUID, ADAFRUIT_CHARACTERISTIC_UUID, ab);
    }
  }

  /**
   * Emulate what the BLE library would do:
   * Take a message, break it up into chunks, and send the chunks as array buffers.
   */
  protected emulateTympanSendingMessage(msg: string) {

    //console.log(`emulating the sending of $msg.length}: ${msg}`);
    const thisDev = this;
    function sendString(str: string) {
      let data = [];
      data[0] = str;
      thisDev.bufferHandler(data);
    }

    function sendByteArray(arr: Uint8Array) {
      let data = [];
      data[0] = arr;
      thisDev.bufferHandler(data);
    }

    function sendArrayBuffer(ab: ArrayBuffer) {
      let data = [];
      data[0] = ab;
      thisDev.bufferHandler(data);
    }

    if (msg.length < BLE_MAX_TRANSMISSION_LENGTH) {
      // "short" message
      let ab = stringToArrayBuffer(String.fromCharCode.apply(null, [BLE_SHORTPACKET_PREFIX_BYTE])+msg);
      sendArrayBuffer(ab);
    } else {
      // Too long.  Send a header packet, followed by payload packets.
      const msglen = msg.length;
      let prefix = String.fromCharCode.apply(null, BLE_HEADERPACKET_PREFIX);
      /* The chunk is the message length xxxxxx in 14 bits, with a preceding and trailing 1 bit. */
      let chunk = String.fromCharCode.apply(null, [(msglen&0xFFFF)>>7 | 0x80 , (msglen&0x7F) << 1 | 0x01]);
      let ab = stringToArrayBuffer(prefix.concat(chunk));
      sendArrayBuffer(ab);
      let pointer = 0;
      let payloadCounter = 0;
      while (pointer < msg.length) {
        let len = BLE_MAX_TRANSMISSION_LENGTH - 1;
        let prefix = String.fromCharCode.apply(null, [(BLE_PAYLOADPACKET_PREFIX_HIGHNIBBLE<<4) + (payloadCounter%16)]);
        let chunk = msg.slice(pointer,pointer+len);
        let ab = stringToArrayBuffer(prefix.concat(chunk));
        sendArrayBuffer(ab);
        pointer += len;
        payloadCounter++;
      }

    }
  }


  public bufferHandler(data) {
    // Message types, by their first byte+:
    // 0xABADCODEFF : A header packet
    // 0XFn : A payload packet, where n is the packet counter mod 16
    // 0xCC : A short packet
    let thisDev = this;

    // Functions for identifying a packet's type:
    function isHeaderPacket(pkt: Uint8Array) {
      const HEADER_CODE = String.fromCharCode.apply(null, BLE_HEADERPACKET_PREFIX);
      return pkt.byteLength === 7 && String.fromCharCode.apply(null, pkt.slice(0, 5)) == HEADER_CODE;
    }
    function isPayloadPacket(pkt: Uint8Array) {
      //console.log('0x'+pkt[0].toString(16) + ': ' + String.fromCharCode.apply(null, pkt.slice(1)));
      return pkt.byteLength > 0 && (pkt[0]>>4===0x0F); // BLE_PAYLOADPACKET_PREFIX_HIGHNIBBLE
    }
    function isShortPacket(pkt: Uint8Array) {
      return pkt.byteLength > 0 && (pkt[0] === BLE_SHORTPACKET_PREFIX_BYTE);
    }
    function isIndicativeOfBluetoothError(pkt: Uint8Array) {
      const hc = [0x31, 0x34, 0x20];
      const HEADER_CODE = String.fromCharCode.apply(null, hc);
      return pkt.byteLength >= 3 && String.fromCharCode.apply(null, pkt.slice(0, 3)) == HEADER_CODE;
    }

    // Functions for handling packets:
    function handleHeaderPacket(pkt: Uint8Array) {
      console.log('Found a header!!!: ' + uint8ArrayToHexString(pkt));
      thisDev.incomingMessage = {
        msg: '',
        msgLen: (pkt[5] & 0x7F) << 7 | (pkt[6] & 0xFE) >> 1,
        packetsReceived: 0
      }
    }
    function handlePayloadPacket(pkt: Uint8Array) {
      if (thisDev.incomingMessage === null) {
        thisDev.logger.log('ERROR: Received unexpected message packet (no preceding header)');
        return;
      }
      const idx = pkt[0] & 0x0F;
      if (idx === (thisDev.incomingMessage.packetsReceived & 0x0F)) {
        thisDev.incomingMessage.msg += String.fromCharCode.apply(null, pkt.slice(1));
        thisDev.incomingMessage.packetsReceived++;
        if (thisDev.incomingMessage.packetsReceived === 1 && thisDev.incomingMessage.msg.startsWith('JSON=')) {
          thisDev.setStatus('Receiving...');
        }
  
        if (thisDev.incomingMessage.msg.length === thisDev.incomingMessage.msgLen) {
          let msg = thisDev.incomingMessage.msg;
          thisDev.incomingMessage = null;
          console.log('Interpreting message:');
          console.log(msg);
          thisDev.interpretDataFromDevice(msg);
        } else if (thisDev.incomingMessage.msg.length > thisDev.incomingMessage.msgLen) {
          thisDev.logger.log('ERROR: Received more characters than expected, based on the header');
          console.log(thisDev.incomingMessage);
          thisDev.incomingMessage = null;
        }
      } else {
        thisDev.logger.log('ERROR: out of order packets.  Expected ' + thisDev.incomingMessage.packetsReceived + ' but got ' + idx + ' instead.');
      }
    }
    function handleShortPacket(pkt: Uint8Array) {
      thisDev.interpretDataFromDevice(String.fromCharCode.apply(null, pkt.slice(1)));
    }

    // Deal with the arriving packet:
    let pkt = new Uint8Array(data[0]);

    if (this.incomingMessage === null) {
      // here we're listening for anything except a payload packet:
      if (isHeaderPacket(pkt)) {
        //this.logger.log('Found a header packet.');
        handleHeaderPacket(pkt);
      } else if (isShortPacket(pkt)) {
        handleShortPacket(pkt);
      } else {
        this.logger.log('Uknown packet type. Maybe it is just a string? Passing it along.');
        if (isIndicativeOfBluetoothError(pkt)) {
          this.logger.log('Packet suggests there may be a BLE firmware mismatch.');
        }
        this.logger.log(uint8ArrayToHexString(pkt));
        this.interpretDataFromDevice(arrayBufferToString(pkt));
      }
    } else {
      // I better receive a payload packet...
      if (isPayloadPacket(pkt)) {
        handlePayloadPacket(pkt);
      } else {
        this.logger.log("Was expecting a payload packet, but didn't get one.  Resetting listening.");
        this.incomingMessage = null;
      }
    }
  }

}


/***************************************************************
*
* GENERAL HELPER FUNCTIONS
*
****************************************************************/

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

export function stringToArrayBuffer(str: string) {
    var buf = new ArrayBuffer(str.length); // 1 byte for each char
    var bufView = new Uint8Array(buf);
    for (var i=0; i < str.length; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

export function arrayBufferToString(buf: ArrayBuffer): string {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

export function uint8ArrayToHexString(arr: Uint8Array) {
  let hx = '0x';
  arr.forEach((s)=>{
    hx += (s).toString(16).toUpperCase().padStart(2, '0');
  });
  return hx;
}
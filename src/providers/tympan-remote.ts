import { Injectable } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';

/**
 * This class contains the variables and methods for the Tympan Remote app.
 */
@Injectable({
  providedIn: 'root'
})
export class TympanRemote {
  public btSerial: BluetoothSerial;
  public devList: any;
  public logArray: string[];
  public activeDevice: number;
  public cards: any;

  /* Emulate preference */
  /*
  get emulate() : boolean {
    if ( _.isUndefined(localStorage.emulate) ) {
      // default to emulate in browser and not on device.
      localStorage.emulate = _.isUndefined(window.cordova);
    }
    return JSON.parse(localStorage.emulate);
  }
  set emulate(val : boolean) {
    if ( val !== localStorage.emulate ) {
      this.reset();
    }
    localStorage.emulate = val;
  }
  */

  constructor() {
    this.btSerial = new BluetoothSerial();
    this.devList = [];
    this.logArray = [];
    this.activeDevice = -1;
    this.cards = [
      {
        'name': 'Algorithm',
        'buttons': [
          {'label': 'A', 'cmd': 'a'},
          {'label': 'B', 'cmd': 'b'}
        ]
      },
      {
        'name': 'High Gain',
        'buttons': [
          {'label': '-', 'cmd': '#'},
          {'label': '+', 'cmd': '3'}
        ]
      },
      {
        'name': 'Mid Gain',
        'buttons': [
          {'label': '-', 'cmd': '@'},
          {'label': '+', 'cmd': '2'}
        ]
      },
      {
        'name': 'Low Gain',
        'buttons': [
          {'label': '-', 'cmd': '!'},
          {'label': '+', 'cmd': '1'}
        ]
      }
    ];

    this.log('hello');
    this.getDeviceList();
  }

  /*
   * Disconnect and delete any devices (useful for page reload or
   *  change in bluetooth config)
   */
  public reset() {
    // Should reset the bluetooth connection, disconnecting from any active device.
  }

  public setActiveDevice(idx: number) {
    this.activeDevice = idx;
    let dev = this.devList[this.activeDevice];
    this.log(`setAD: connecting to ${idx} (${dev.id})`); //  `
    this.btSerial.connect(dev.id).subscribe(()=>{
      this.log('CONNECTED');
      this.subscribe();
      this.sayHello();
    },()=>{
      this.log('CONNECTION FAIL');
    });
  }

  public subscribe() {
    let dev = this.devList[this.activeDevice];    
    this.btSerial.subscribe('\n').subscribe((data)=>{
      this.log(`> ${data}`);
    });
  }

  public sayHello() {    
    this.send('h');
  }

  public async getDeviceList () {
    this.log('Getting device list:');
    let active = true;
    if (active) {
      this.btSerial.list().then((devices)=>{
        for (let idx = 0; idx<devices.length; idx++) {
          let device = devices[idx];
        }
        // We should eventually do this update a bit smoother
        this.devList = devices;
      },()=>{
        this.log(`failed to get device list`);
      });
      this.log('DONE.');
    }
  }

  public log(s: string) {
    console.log(s);
    this.logArray.push(s);
    console.log("logs are:");
    console.log(this.logArray);
  }

  public send(s: string) {
    let active = this.activeDevice > -1;
    if (active) {
      let dev = this.devList[this.activeDevice];
      this.log(`Sending ${s} to ${dev.id}`);  
      this.btSerial.write(s).then(()=>{
        //this.log(`Successfully sent ${s}`);
      }).catch(()=>{
        this.log(`Failed to send ${s}`);
      });
    } else {
      this.log('INACTIVE.  SEND FAIL.');
    }
  }
}



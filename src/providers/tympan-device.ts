import { Injectable, NgZone } from '@angular/core';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import ieee754 from 'ieee754';

import { BluetoothType } from './tympan-remote'; 

/**
 * This class contains the variables and methods for the Tympan Remote app.
 */
@Injectable({
  providedIn: 'root'
})
export class TympanDevice {  
  public id: string;
  public name: string;
  uuid?: string;
  class?: number;
  address?: string;
  rssi?: number;
  public emulated: boolean;
  public btType: BluetoothType;

  constructor(dev: any) {
    this.id = dev.id;
    this.name = dev.name;
    this.emulated = dev.emulated;
    this.btType = dev.btType;
  }
}

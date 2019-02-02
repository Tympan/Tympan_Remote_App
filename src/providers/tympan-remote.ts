import { Injectable } from '@angular/core';
import { TympanDevice } from './tympan-device';

/**
 * This class contains the variables and methods for the Tympan Remote app.
 */
@Injectable({
  providedIn: 'root'
})
export class TympanRemote {
    public devices: TympanDevice[] = [];

    constructor() {
        this.devices = [];
        this.devices.push(new TympanDevice('myuuid'));
    }
}

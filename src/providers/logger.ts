import { Injectable, NgZone } from '@angular/core';

/**
 * This class contains the variables and methods for the logger.
 */
@Injectable({
  providedIn: 'root'
})
export class Logger {
  public logArray: string[];

  constructor(private zone: NgZone) {
    this.logArray = [];
  }

  public log(s: string) {
    console.log(s);
    this.zone.run(()=>{
      this.logArray.push(s);
    });
  }
}



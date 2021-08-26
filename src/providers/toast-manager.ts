import { Injectable, NgZone } from '@angular/core';

/**
 * This class contains the variables and methods for the toast manager.
 */
@Injectable({
  providedIn: 'root'
})
export class ToastManager {
  public toastId: string;
  public toastItem: any;

  constructor(private zone: NgZone) {
    this.toastId = undefined;
    this.toastItem = undefined;
  }

  /* Present a toast message.  
   * Deletes any old toasts first, so there can only be one toast at a time 
   */
  public presentToast(msg: string, duration_ms?: number) {
    // First, dismiss any old toasts:
    if (this.toastId) {
      this.dismissToast(this.toastId);
    }
    // Make a new toast:
    let toastId = (new Date()).toJSON();
    const toast = document.createElement('ion-toast');
    toast.message = msg;
    if (duration_ms != undefined) {
      toast.duration = duration_ms;
    }
    toast.position = 'top';
    toast.color = 'primary';
    // Prepare the function that is called when the toast is dismissed:
    let thisTM = this;
    toast.onDidDismiss().then(()=>{
      // If the currently-shown toast is this one, wipe it out.
      if (toastId === thisTM.toastId) {
        thisTM.toastId = undefined;
        thisTM.toastItem = undefined;  
      }
    });
    // Present the toast:
    document.body.appendChild(toast);
    return toast.present().then(()=>{
      thisTM.toastId = toastId;
      thisTM.toastItem = toast;
      return toastId;
    });
  }

  public dismissToast(id: string) {
    if (this.toastId == id) {
      this.toastItem.dismiss();
    }
  }

  public toastHasDismissed(id: string): Promise<any> {
    if (id === this.toastId) {
      return this.toastItem.onDidDismiss();
    } else {
      return Promise.resolve();
    }
  }
}



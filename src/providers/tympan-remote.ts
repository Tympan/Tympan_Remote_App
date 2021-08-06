import { Injectable, NgZone } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { BLE } from '@ionic-native/ble/ngx';
import { File } from '@ionic-native/file/ngx';
import { Logger } from './logger';
import { Plotter } from './plotter';
import { ToastManager } from './toast-manager';

const ADAFRUIT_SERVICE_UUID = "BC2F4CC6-AAEF-4351-9034-D66268E328F0";
const ADAFRUIT_CHARACTERISTIC_UUID = "06D1E5E7-79AD-4A71-8FAA-373789F7D93C";
const BLE_SCAN_DURATION_SEC = 8;

import {
	DATASTREAM_START_CHAR,
	DATASTREAM_SEPARATOR,
	DATASTREAM_END_CHAR,
	BUTTON_STYLE_ON,
	BUTTON_STYLE_OFF,
	BUTTON_STYLE_NONE,
	BOYSTOWN_PAGE_PLOT,
	DEFAULT_CONFIG,
	DEFAULT_CONFIG2,
} from './tympan-config';

import {
	DSL,
	WDRC,
	AFC
} from './prescriptions';

import {
	TympanDeviceConfig, //interface
	TympanBTSerialConfig, //interface
	TympanBLEConfig, //interface
	TympanDevice,
	TympanBTSerial,
	TympanBLE,
	numberAsCharStr,
	isNumeric,
	stringToArrayBuffer,
	TympanDeviceState
} from './tympan-device';
import { Router } from '@angular/router';

/**
 * This class contains the variables and methods for the Tympan Remote app.
 */
@Injectable({
	providedIn: 'root'
})
export class TympanRemote {
	public btSerialIsEnabled: boolean;
	public btSerial: any; //BluetoothSerial;
	public bleIsEnabled: boolean = true;
	public _emulate: boolean = false; // show emulated devices?
	public connected: boolean = false;
	public showLogs: boolean = false;
	public showDevOptions: boolean = false;
	public showSerialMonitor: boolean = false;
	public showSerialPlotter: boolean = true;
	public scanning: boolean = false;
	// properties related to the connected device:
	private _allDevices: TympanDevice[];
	private _activeDeviceIdx: number;
	
	get activeDevice() {
		if (this.connected && this._activeDeviceIdx>=0) {
			return this._allDevices[this._activeDeviceIdx];
		} else {
			return undefined;
		}
	}

	get activeDeviceId() {
		if (this.connected && this._activeDeviceIdx>=0) {
			return this._allDevices[this._activeDeviceIdx].id;
		} else {
			return undefined;
		}
	}

	get emulate(): boolean {
		return this._emulate;
	}

	set emulate(tf: boolean) {
		console.log(`setting emulate to ${tf}`);
		if ((tf === false) && this.activeDevice && (this.activeDevice.emulated===true)) {
			this.disconnectFromAll();
		}
		console.log(this._allDevices);
		this.zone.run(()=>{
			this._emulate = tf;
		});
	}

	get devices(): any {
		if (this._emulate) {
			return this._allDevices.filter(dev=>(dev.state===TympanDeviceState.AVAILABLE));
		} else {
			return this._allDevices.filter(dev=>(!dev.emulated && (dev.state===TympanDeviceState.AVAILABLE)));
		}
	}

	get prescriptionPages() {
		if (this.activeDevice) {
			return this.activeDevice.prescriptionPages;
		} else {
			return undefined;
		}
	}

	get devIcon(): string {
		if (this.activeDevice) {
			return this.activeDevice.devIcon;
		} else {
			return undefined;
		}
	}

	get activeDeviceIdx() {
		return this._activeDeviceIdx;
	}

	set activeDeviceIdx(idx: number) {
		this.zone.run(()=>{
			this._activeDeviceIdx = idx;
		})
	}

	constructor(
		public ble: BLE, 
		private platform: Platform, 
		private router: Router,
		private zone: NgZone, 
		private logger: Logger, 
		private plotter: Plotter,
		private TRToast: ToastManager, 
		private androidPermissions: AndroidPermissions, 
		private file: File) 
	{
		this.btSerialIsEnabled = false;
		this.btSerial = undefined; //new BluetoothSerial();
		this.bleIsEnabled = true;
		this._emulate = false;
		this.connected = false;
		this.showLogs = false;
		this.showDevOptions = false;
		this.showSerialMonitor = false;
		this.showSerialPlotter = false;
		this._allDevices = [];
		this._activeDeviceIdx = -1;

		this.disconnectFromAll(); // start by being disconnected.  Also resets to default prescription.

		const DEVICE_1: TympanDeviceConfig = {
		  id: 'mo:ck:01',
		  name: 'mock1',
		  status: '',
		  emulated: true,
		  emulatedProperties: {config: DEFAULT_CONFIG},
		  parent: this
		};

		const DEVICE_2: TympanDeviceConfig = {
		  id: 'mo:ck:02',
		  name: 'mock2',
		  status: '',
		  emulated: true,
		  emulatedProperties: {config: DEFAULT_CONFIG2},
		  parent: this
		};

		// Add mock devices:
		this.addDevice(new TympanBLE(DEVICE_1));
		this.addDevice(new TympanBLE(DEVICE_2));

		this.whenReady();
	}

	private async whenReady(): Promise<any> {
		// Do some things when the platform is ready
		return this.platform.ready()
		.then(()=>{
			// Don't get BLE going, because we may need to wait and ask for permissions first
			//this.updateDeviceList();
			//return this.checkBluetoothStatus();
			return true;
		});
	}

	private getDeviceIdxWithId(id: string) {
		return this._allDevices.findIndex((dev)=>{return dev.id === id;});
	}

	public addDevice(dev: TympanDevice) {
		let idx = this.getDeviceIdxWithId(dev.id);
		if (idx<0) {
			this.zone.run(()=>{this._allDevices.push(dev)});
		} else {
			// Update the device in some way?
		}
		this.getDeviceWithId(dev.id).state = TympanDeviceState.AVAILABLE;

	}

	public removeDeviceWithId(devId: string) {
		if (this._allDevices.hasOwnProperty(devId)) {
			delete this._allDevices[devId];
		}
	}

	public isActiveId(id: string) {
		return id == this.activeDeviceId;
	}

	public getDeviceWithId(id: string) {
		let device = this._allDevices.find((dev)=>{
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

	public async presentAlert(message: string) {
		const alert = document.createElement('ion-alert');
		alert.header = 'Your Data';
		//alert.subHeader = 'Subtitle';
		alert.cssClass = 'permissionsAlertMessage';
		alert.message = message;
		alert.buttons = ['OK'];

		document.body.appendChild(alert);
		await alert.present();

		const { role } = await alert.onDidDismiss();
		console.log('onDidDismiss resolved with role', role);

		return role;
	}

	/* 
	 * Request an array of permissions
	 */
	public async requestPermissions(permissions: string[]): Promise<any> {
		let permissionsGranted = true;
		for (let permission of permissions) {
			let r = await this.androidPermissions.requestPermission(permission);
			permissionsGranted = permissionsGranted && r.hasPermission;
		}
		return permissionsGranted ? Promise.resolve(true) : Promise.reject(false);
	}

	/* 
	 * Assert that an array of permissions has been granted.  If they are not,
	 * the message will be displayed in an alert to the user and then the user
	 * will be asked to grant the permissions.
	 */
	public async assertPermissions(permissions: string[], message: string): Promise<any> {
		let hasPermissions = true;
		for (let permission of permissions) {
			let p = await this.androidPermissions.checkPermission(permission);
			hasPermissions = hasPermissions && p.hasPermission;
		}
		if (hasPermissions) {
			return Promise.resolve(true);
		} else {
			return this.presentAlert(message).then(()=>{
				return this.requestPermissions(permissions);
			});
		}
	}

	public async checkBluetoothStatus(): Promise<any> {
		this.logger.log('Checking BT status...');
		if (!this.platform.is('cordova')) {
			this.logger.log('Bluetooth is unavailable; not a cordova platform');
			this.btSerialIsEnabled = false;
			this.bleIsEnabled = false;
			return Promise.resolve(false);
		} else if (this.platform.is('android')) {
			let bluetoothPermissions = ["android.permission.BLUETOOTH","android.permission.BLUETOOTH_ADMIN"];
			let bluetoothMessage = "This app uses Bluetooth Low Energy (BLE) to talk to Tympan devices.  Please grant permission for this app to communiate via Bluetooth.";
			let locationPermissions  = ["android.permission.ACCESS_FINE_LOCATION"];
			let locationMessage = "This uses Bluetooth to talk to Tympan devices. In order to use Bluetooth, this app requires access to your location.  Note that the Tympan Remote App <b>NEVER</b> does anything with your location (see for yourself at github.com/Tympan). However, you still must grant this app access to your location for the app to work.  We apologize for this inconvenience.";

			return this.assertPermissions(bluetoothPermissions, bluetoothMessage)
			.then(()=>{
				return this.assertPermissions(locationPermissions, locationMessage);
			}).then(()=>{
				this.logger.log('Is BLE plugin enabled?');
				return this.ble.isEnabled();
			}).then(
				()=>{
					this.logger.log('Bluetooth is enabled.');
					//this.bluetooth = true;
					return Promise.resolve(true);
				},()=>{
					this.logger.log('Bluetooth is not enabled.');
					//this.bluetooth = false;
					return Promise.resolve(false);
				}
			).catch(()=>{
				this.logger.log('Error checking bluetooth status');
				return Promise.resolve(false);
			});
		} else if (this.platform.is('ios')) {
			// iOS doesn't do Bluetooth Serial for Tympan.
			this.btSerialIsEnabled = false;
			// Check if BLE is enabled:
			return this.ble.isEnabled().then(()=>{
				this.logger.log('BLE is enabled.');
				this.bleIsEnabled = true;
				return this.bleIsEnabled;
			}).catch(()=>{
				this.logger.log('BLE is not enabled.');
				this.bleIsEnabled = false;
				return this.bleIsEnabled;
			});
		}
	}

	/* 
	 * Disconnect from a device with id.
	 */
	public disconnectFromId(id: string) {
		let device = this.getDeviceWithId(id);
		if (device) {
			device.disconnect();
		}
	}

	/* 
	 * Disconnect from a device with id.
	 */
	public disconnectFromAll() {
		this.activeDeviceIdx = -1;
		this.connected = false;
		for (let device of this.devices) {
			device.disconnect();
		}

		/*
		if (this.bluetooth) {
			//this.btSerial.disconnect();
		}
		*/
	}

	public toggleState(id){
		id=!id
	}

	/*
	 * Do some things once a device is disconnected.
	 * Typically, this function is called by a device, once the device realizes it is disconnected 
	 * (no matter which end initiates the device disconnect)
	 */ 
	public onDisconnectDevice(device: TympanDevice) {
		if (this.isActiveId(device.id)) {
			this.activeDeviceIdx = -1;
			this.connected = false;
			this.TRToast.presentToast(`Disconnected from ${device.name}`,2000);
		}
		this.router.navigateByUrl('tabs/connect')
	}

	public async connectToId(id: string) {

		this.logger.log(`remote.connectToId: setting device with id ${id} as active.`);
		this.disconnectFromAll();

		let devIdx = this.getDeviceIdxWithId(id);
		let dev = this._allDevices[devIdx];
		if (devIdx<0) {
			this.logger.log('Could not find device.');
			this.activeDeviceIdx = -1;
			return;
		}
		this.logger.log(`Connecting to ${dev.name} (${dev.id})`);
		let toastId = await this.TRToast.presentToast('Connecting');
		// Set up the disconnect function, for when the device and app become disconnected (no matter which end caused the disconnect)
		var onDisconnect = function() {
			this.connected = false;
			this.activeDeviceIdx = -1;
		}
		// Attempt to connect:
		dev.connect((d)=>{this.onDisconnectDevice(d);}).then(()=>{
			this.logger.log('Connection succeeded.');
			this.connected = true;
			this.activeDeviceIdx = devIdx;
			this.TRToast.dismissToast(toastId);
		}).catch(()=>{
			this.logger.log('Connection failed');
			this.connected = false;
			this.activeDeviceIdx = -1;
			this.TRToast.dismissToast(toastId);
			this.TRToast.presentToast('Bluetooth connection failed.',2000);
		});

/*
		this.btSerial.connect(dev.id).subscribe(()=>{
			this.logger.log('CONNECTED');
			this.activeDeviceIdx = this.getDeviceIdxWithId(dev.id);
			this.connected = true;
			dev.status = "Connected";
			//toast.dismiss();
			this.subscribe();
			this.sayHello();
		},()=>{
			this.zone.run(()=>{
				this.logger.log('CONNECTION FAIL');
				//toast.dismiss();
				this.presentToast('Bluetooth connection failed.',2000);
				this.activeDeviceIdx = -1;
				dev.status = 'Connection fail.';
				this.connected = false;          
			});
		});      
*/
	}

	public testFn() {
		console.log("Running the test function...");
    	this.checkBluetoothStatus();
		let longLocationMsg = "This app uses Bluetooth to talk to Tympan devices. Since it possible an app <i>could</i> try to use Bluetooth to discern the user's location, Some versions of Android require that 'fine location access' and 'background location access' be granted in order to use Bluetooth.  Note that the Tympan Remote App <b>NEVER</b> does anything with your location (see for yourself at github.com/Tympan). However, you still must grant this app access to 'fine location' for the app to work. We apologize for this inconvenience.";
		this.presentAlert(longLocationMsg);
	}

	public subscribe() {
		if (this.btSerialIsEnabled && this.btSerial) {
			this.logger.log('subscribing');
			//this.btSerial.subscribe('\n').subscribe((data)=>{this.interpretDataFromDevice(data);});
		}
	}

	public async updateDeviceList() {
		let priorDevIds = this.devices.map(d=>d.id);
		console.log('current device ids:');
		console.log(priorDevIds);

		let newDevIds = [];
		let thisTR = this;
		let finishScan = function() {
			thisTR.scanning = false;
			thisTR.logger.log('Done scanning.');
			for (let i=0; i<priorDevIds.length; i++) {
				let priorId = priorDevIds[i];
				if (!newDevIds.includes(priorId)) {
					thisTR.getDeviceWithId(priorId).state = TympanDeviceState.UNAVAILABLE;
				}
			}
		}

		this.logger.log('Updating device list:');
		// Make sure we know the bluetooth status first:
    	this.checkBluetoothStatus().then(()=>{
	    // Add Bluetooth Serial devices:
			if (this.btSerialIsEnabled) {
				/*			
				this.scanning = true;
				this.btSerial.list().then((btDevices)=>{
					let activeBtDeviceIds = btDevices.map((d)=>{return d.id;});
					// First, get rid of all devices that have lost bluetooth:
					for (let i = this._allDevices.length-1; i>=0; i--) {
						let storedDevice = this._allDevices[i];
						if (!activeBtDeviceIds.includes(storedDevice.id) && !storedDevice.emulated) {
							this.removeDeviceWithId(storedDevice.id);
						}
					}
					// Then add new devices:
					for (let idx = 0; idx<btDevices.length; idx++) {
						let device = btDevices[idx];
						this.logger.log(`Found device ${device.name}`);
						device.emulated = false;
						this.addDevice(device);
					}
	        // Then add unpaired devices:
	        if (0) {
	          return this.btSerial.discoverUnpaired().then((btDevices)=>{
	            for (let idx = 0; idx<btDevices.length; idx++) {
	              let device = btDevices[idx];
	              if (device.name != undefined) {
	                this.logger.log(`Found unpaired device ${device.name}; adding.`);
	                device.emulated = false;
	                this.addDevice(device);                            
	              } else {
	                this.logger.log(`Found undefined unpaired device ${device.name}; not adding.`);
	              }
	            }
	          });
	        else {
	         	return Promise.resolve(1);

	                }
				},()=>{
					this.logger.log(`Failed to get device list.`);
				});
				*/			
			}

			// Add BLE devices:
			if (this.bleIsEnabled) {
				this.logger.log('scanning for BLE devices...');
				this.scanning = true;

				let scanTimeout = setTimeout(()=>{
						console.log('Scan timeout called.');
						finishScan();
					}, BLE_SCAN_DURATION_SEC*1000);

				this.ble.scan([ADAFRUIT_SERVICE_UUID],BLE_SCAN_DURATION_SEC)
				.subscribe(
					(device)=>{
						// on device detection, add it to the list of contacted devices
						this.logger.log(`Detected device! name: ${device.name}, id: ${device.id}`);
						console.log(device);
						newDevIds.push(device.id);
						let tympConf: TympanBLEConfig = {
							id: device.id,
							name: device.name,
							emulated: false,
							rssi: device.rssi,
							parent: this
						};
						// Add the device to the list:
						this.addDevice(new TympanBLE(tympConf));
					},
					()=>{
						console.log('Scan fail.');
						clearTimeout(scanTimeout);
						finishScan();
					}
				);
			}
		});
	}

	public setUpPages() {
		// let defaultConnectedPages = [this.pages[0], this.pages[1], this.pages[2]];
		// this.pages = defaultConnectedPages;
		// this.pages = DEFAULT_CONFIG.pages;
		/* 
		
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

		*/
	}

	public send(s: string) {
		if (!this.connected) {
			this.logger.log('Not connected to a device.');
			return;
		}

		if (this.activeDevice) {
			this.logger.log(`Sending ${s} to ${this.activeDevice.name}`);  
			this.activeDevice.write(s);			
		}
	}

	public formatData(){
		console.log('formatting data');
		let card = new DSL().asPage().cards[0];
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
			xval = card.inputs[4].columns[0].values[val];
			yval1 = card.inputs[4].columns[3].values[val];
			TKGainData.push({x: xval, y: yval1});

			xval = card.inputs[4].columns[0].values[val];
			yval2 = card.inputs[4].columns[4].values[val];
			TKData.push({x: xval, y: yval2});

			xval = card.inputs[4].columns[0].values[val];
			yval3 = card.inputs[4].columns[6].values[val];
			BOLTData.push({x: xval, y: yval3});
		}
		TKGainData.push({x: 12000, y: yval1});
		TKData.push({x: 12000, y: yval2});
		BOLTData.push({x: 12000, y: yval3});

		graphData = [TKGainData, TKData, BOLTData];
		return graphData;
	}

	public sendInputCard(card: any) {
		if (!this.connected) {
			this.logger.log('Not connected to a device.');
			return;
		}

		console.log('sending...');
		console.log(card);

		let dataStr = card.submitButton.prefix + DATASTREAM_SEPARATOR;
		for (let input of card.inputs) {
			if (isNumeric(input.type)) {
				dataStr += numberAsCharStr(input.value, input.type);
				//dataStr += ',';
			} else if (input.type ==='grid') {
				for (let col of input.columns) {
					//dataStr += '[';
					for (let value of col.values) {
						dataStr += numberAsCharStr(value, col.type);
						//dataStr += ',';
					}
					//dataStr += '],';
				} 
			}
		}

		this.logger.log("Sending " + DATASTREAM_START_CHAR + ", length = " + dataStr.length.toString());

		let charStr = DATASTREAM_START_CHAR + numberAsCharStr(dataStr.length,'int32') + DATASTREAM_SEPARATOR + dataStr + DATASTREAM_END_CHAR;

		if (true) {
			this.logger.log('Not sending card; feature not enabled yet.');
			/*
			this.btSerial.write(charStr).then(()=>{
				//this.logger.log(`Successfully sent ${charStr}`);
			}).catch(()=>{
				this.logger.log(`Failed to send ${charStr}`);
			});
			*/
		} else {
			this.logger.log('INACTIVE.  SEND FAIL.');
		}
	}

	public writeTRDataFile(csv: string) {
		let filename = "tr-data-"+(new Date()).toISOString()+".csv";
		filename=filename.replace(/:/g,'-'); // ':' is a forbidden filesystem character.

		this.file.createFile(this.file.externalDataDirectory, filename, false);
		this.file.writeExistingFile(this.file.externalDataDirectory,filename,csv);
	}

}


import { Injectable, NgZone } from '@angular/core';
import { Platform } from '@ionic/angular';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { File } from '@ionic-native/file/ngx';
import { Logger } from './logger';
import { Plotter } from './plotter';

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
	BUTTON_STYLE_NONE,
	BOYSTOWN_PAGE_DSL,
	BOYSTOWN_PAGE_WDRC,
	BOYSTOWN_PAGE_AFC,
	BOYSTOWN_PAGE_PLOT,
	DEFAULT_CONFIG,
	numberAsCharStr,
	charStrToNumber,
	isNumeric
} from './tympan-config';

import {
	DSL,
	WDRC,
	AFC
} from './prescriptions';

/**
 * This class contains the variables and methods for the Tympan Remote app.
 */
@Injectable({
	providedIn: 'root'
})
export class TympanRemote {
	public bluetooth: boolean = false;
	public btSerial: BluetoothSerial;
	public _emulate: boolean = false; // show emulated devices?
	public connected: boolean = false;
	public showLogs: boolean = false;
	public showDevOptions: boolean = false;
	public showSerialMonitor: boolean = false;
	public showSerialPlotter: boolean = true;
	// properties related to the connected device:
	private _allDevices: iDevice[];
	private _activeDeviceIdx: number;
	private _config: any = {};
	
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

	get deviceIds(): string[] {
		// Should only return emulated devices if emulate
		let deviceIds: string[] = [];
		for (let i=0; i<this._allDevices.length; i++) {
			let dev = this._allDevices[i];
			//this.logger.log(dev);
			if (dev.emulated && !this._emulate) {
				// do nothing
				console.log('doing nothing');
			} else {
				this.logger.log(`Pushing ${dev.id}`);
				deviceIds.push(dev.id);
			}
		}
		console.log('Device ids:');
		console.log(deviceIds);
		return deviceIds;
	}

	get emulate(): boolean {
		return this._emulate;
	}

	set emulate(tf: boolean) {
		console.log(`setting emulate to ${tf}`);
		if ((tf === false) && this.activeDevice && (this.activeDevice.emulated===true)) {
			this.disconnect();
		}
		console.log(this._allDevices);
		this.zone.run(()=>{
			this._emulate = tf;
		});
	}

	get devices(): any {
		if (this._emulate) {
			return this._allDevices;
		} else {
			return this._allDevices.filter(dev=>!dev.emulated);
		}
	}

	get globalPages() {
		return this._config.global.pages;
	}

	get prescriptionPages() {
		return this._config.prescription.pages;
	}

	get devIcon(): string {
		return this._config.prescription.devIcon;
	}

	get activeDeviceIdx() {
		return this._activeDeviceIdx;
	}

	set activeDeviceIdx(idx: number) {
		this.zone.run(()=>{
			this._activeDeviceIdx = idx;
		})
	}

	constructor(private platform: Platform, private zone: NgZone, private logger: Logger, private plotter: Plotter, private androidPermissions: AndroidPermissions, private file: File) {
		this.btSerial = new BluetoothSerial();
		this._emulate = false;
		this.connected = false;
		this.showLogs = false;
		this.showDevOptions = false;
		this.showSerialMonitor = false;
		this.showSerialPlotter = false;
		this._allDevices = [];
		this._activeDeviceIdx = -1;
		this._config = {};
		this.bluetooth = false;

		this.disconnect(); // start by being disconnected.  Also resets to default prescription.

		// Add mock devices:
		this.addDevice(DEVICE_1);
		this.addDevice(DEVICE_2);

		this.whenReady();
	}

	private async whenReady(): Promise<any> {
		// When the platform is ready, get the bluetooth going
		return this.platform.ready()
		.then(()=>{
			return this.checkBluetoothStatus();
		}).then(()=>{
			this.logger.log('hello');
			this.updateDeviceList();
			return Promise.resolve(true);
		});
	}

	private getDeviceIdxWithId(id: string) {
		return this._allDevices.findIndex((dev)=>{return dev.id === id;});
	}

	public addDevice(dev: iDevice) {
		let idx = this.getDeviceIdxWithId(dev.id);
		if (idx<0) {
			this._allDevices.push(dev);
		} else {
			// Update the device in some way?
		}
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

	public buildPrescriptionPages(presc: any): any {

		let pages = [];

		if (presc && presc.type == 'BoysTown') {
			for (let pageName of presc.pages) {
				console.log(pageName);
				switch (pageName) {
					case 'multiband': {
						pages.push(BOYSTOWN_PAGE_DSL);
						break;
					}
					case 'broadband': {
						pages.push(BOYSTOWN_PAGE_WDRC);
						break;
					}
					case 'afc': {
						pages.push(BOYSTOWN_PAGE_AFC);
						break;
					}
					case 'plot': {
						pages.push(BOYSTOWN_PAGE_PLOT);
						break;
					}
					case 'serialMonitor': {
						this.showSerialMonitor = true;
					}
					case 'serialPlotter': {
						this.showSerialPlotter = true;
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

	public setConfig(cfgObj: any) {

		let newConfig = {};

		if (cfgObj.icon) {
			newConfig['devIcon'] = '/assets/devIcon/' + cfgObj.icon;
		}
		if (cfgObj.pages) {
			this.initializePages(cfgObj.pages);
			newConfig['global'] = {'pages': cfgObj.pages};
		}
		if (cfgObj.prescription) {
			newConfig['prescription'] = cfgObj.prescription;
			newConfig['prescription'].pages = cfgObj.pages.concat(this.buildPrescriptionPages(cfgObj.prescription));
		}

		this.zone.run(()=>{
			this._config = newConfig;
			//this.btn = btnStyle;      
		});  	
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
	}

	/*
	 * Disconnect and delete any devices (useful for page reload or
	 *  change in bluetooth config)
	 */
	public reset() {
		// Should reset the bluetooth connection, disconnecting from any connected device.
	}

	public async checkBluetoothStatus(): Promise<any> {
		this.logger.log('Checking BT status...');
		if (!this.platform.is('cordova')) {
			this.logger.log('Bluetooth is unavailable; not a cordova platform');
			this.bluetooth = false;
			return Promise.resolve(false);
		}

		return this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.ACCESS_FINE_LOCATION)
		.then((perm)=>{
			this.logger.log('Has fine location permission? '+perm.hasPermission);
			return Promise.resolve(true);
        }).then(()=>{
        	return this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.BLUETOOTH);
		}).then((perm)=>{
			this.logger.log('Has bluetooth permission? '+perm.hasPermission);
			return Promise.resolve(true);
		}).then(()=>{
			return this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.BLUETOOTH_ADMIN);
		}).then((perm)=>{
			this.logger.log('Has bluetooth admin permission? '+perm.hasPermission);
			return Promise.resolve(true);
		}).then(()=>{
			this.btSerial.isEnabled();
		}).then(()=>{
			this.logger.log('Bluetooth is enabled.');
			this.bluetooth = true;
			return Promise.resolve(true);
		},()=>{
			this.logger.log('Bluetooth is not enabled.');
			this.bluetooth = false;
			return Promise.resolve(false);
		}).catch(()=>{
			this.logger.log('Error checking bluetooth status');
			return Promise.resolve(false);
		});
	}

	public disconnect() {
		this._activeDeviceIdx = -1;
		this.connected = false;
		for (let device of this._allDevices) {
			device.status = '';
		}
		this.setConfig(DEFAULT_CONFIG);
		if (this.bluetooth) {
			this.btSerial.disconnect();
		}
	}

	public toggleState(id){
		id=!id
	}

	public connectToId(id: string) {

		this.logger.log(`remote.connectToId: setting device with id ${id} as active.`);
		this.disconnect();
		let devIdx = this.getDeviceIdxWithId(id);
		let dev = this._allDevices[devIdx];
		if (devIdx<0) {
			this.logger.log('Could not find device.');
			this._activeDeviceIdx = -1;
			return;
		}
		if (dev.emulated) {
			this.activeDeviceIdx = devIdx;
			this.connected = true;
			dev.status = 'connected';
		} else {
			this.logger.log(`setAD: connecting to ${dev.name} (${dev.id})`); //  `
			dev.status = 'Connecting...';
			this.btSerial.connect(dev.id).subscribe(()=>{
				this.logger.log('CONNECTED');
				this.activeDeviceIdx = this.getDeviceIdxWithId(dev.id);
				this.connected = true;
				dev.status = "Connected";
				this.subscribe();
				this.sayHello();
			},()=>{
				this.zone.run(()=>{
					this.logger.log('CONNECTION FAIL');
					this.activeDeviceIdx = -1;
					dev.status = 'Connection fail.';
					this.connected = false;          
				});
			});      
		}
	}

	public adjustComponentById(id: string, field: string, property: any) {
		let adjustableFields = ['label','style'];
		if (!adjustableFields.includes(field)) {
			this.logger.log(`Cannot set the ${field} of ${id}: invalid field.`);
			return;
		}
		for (let page of this._config.global.pages) {
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

	public testFn() {
		console.log("Running the test function...");
        /*
		var canvas = <HTMLCanvasElement> document.getElementById('myChart');
		console.log(canvas);
		*/
    
		this.btSerial.isEnabled().then(()=>{this.logger.log('Is Enabled.');},()=>{this.logger.log('Is Not Enabled.');});
		this.btSerial.isConnected().then(()=>{this.logger.log('Is Connected.');},()=>{this.logger.log('Is Not Connected.');});
        this.btSerial.discoverUnpaired().then((list)=>{
            console.log(list);
        });
        this.checkBluetoothStatus();
	 
        /*
		console.log('testing');
		this.adjustComponentById('algA','label','6^');
		this.adjustComponentById('algB','label','37!!');
		this.adjustComponentById('algC','style',BUTTON_STYLE_ON);
        */
	}

	public subscribe() {
		if (this.bluetooth && this.btSerial) {
			this.logger.log('subscribing');
			this.btSerial.subscribe('\n').subscribe((data)=>{this.interpretDataFromDevice(data);});
		}
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
				this.adjustComponentById(id,'label',val);
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
				//this._config.prescriptionPages()
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

	public async updateDeviceList() {
		this.logger.log('Updating device list:');
        
		if (this.bluetooth) {
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
			},()=>{
				this.logger.log(`Failed to get device list.`);
			});
		}
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

		this.logger.log(`Sending ${s} to ${this.activeDevice.name}`);  
		if (this.bluetooth) {
			this.btSerial.write(s).then(()=>{
				if (s == ']'){
					this.showSerialPlotter = true;
				}
				if (s == '}'){
					this.showSerialPlotter = false;
				}
				this.logger.log(`Successfully sent ${s}`);
			}).catch(()=>{
				this.logger.log(`Failed to send ${s}`);
			});
		} else {
			this.logger.log('mock sending.');
			//this.mockSend(s);
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
			xval = card.inputs[4].columns[0].values[val];
			yval1 = card.inputs[4].columns[3].values[val];
			TKGainData.push({x: xval, y: yval1});

			xval = card.inputs[4].columns[0].values[val];
			yval2 = card.inputs[4].columns[2].values[val];
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

		if (this.bluetooth) {
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

	public writeTRDataFile(csv: string) {
		let filename = "tr-data-"+(new Date()).toISOString()+".csv";
		filename=filename.replace(/:/g,'-'); // ':' is a forbidden filesystem character.

		this.file.createFile(this.file.externalDataDirectory, filename, false);
		this.file.writeExistingFile(this.file.externalDataDirectory,filename,csv);
	}

}


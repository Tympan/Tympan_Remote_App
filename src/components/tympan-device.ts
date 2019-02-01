//import { BluetoothSerial } from 'ionic-native';

export class TympanDevice {
	public label: string;
	public uuid: string;
	public connected: boolean = false;

	constructor(uuid: string) {
		this.label = 'a device';
		this.uuid = uuid;
	}

	public connect() {
		this.connected = true;
	}

	public disconnect() {
		this.connected = false;
	}

	public sendCommand(cmd: string) {
		console.log(`Sending ${cmd} to ${this.label}`);
	}
}
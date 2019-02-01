//import { BluetoothSerial } from 'ionic-native';

import { TympanDevice } from './tympan-device';

export class TympanRemote {
	public devices: TympanDevice[] = [];

	constructor() {
		this.devices = [];
	}
}
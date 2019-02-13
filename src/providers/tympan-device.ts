import { TympanRemote } from './tympan-remote';

export class TympanDevice {
    public label: string;
    public uuid: string;
    public connected: boolean;
    public cards: any;
    public parent: TympanRemote;

    constructor(uuid: string) {
        this.label = 'a device';
        this.uuid = uuid;
        this.connected = false;
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
    }

    public connect() {
        this.connected = true;
    }

    public disconnect() {
        this.connected = false;
    }

    public sendCommand(cmd: string) {
        this.parent.log(`Sending ${cmd} to ${this.label}`);
    }
}

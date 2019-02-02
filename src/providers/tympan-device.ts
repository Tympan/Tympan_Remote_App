export class TympanDevice {
    public label: string;
    public uuid: string;
    public connected: boolean;
    public cards: any;

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
                    {'label': '-', 'cmd': 'c'},
                    {'label': '+', 'cmd': 'C'}
                ]
            },
            {
                'name': 'Mid Gain',
                'buttons': [
                    {'label': '-', 'cmd': 'd'},
                    {'label': '+', 'cmd': 'D'}
                ]
            },
            {
                'name': 'Low Gain',
                'buttons': [
                    {'label': '-', 'cmd': 'e'},
                    {'label': '+', 'cmd': 'E'}
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
        console.log(`Sending ${cmd} to ${this.label}`);
    }
}

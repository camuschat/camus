import EventEmitter from './EventEmitter'

export default class Signaler extends EventEmitter {
    constructor() {
        super();

        const protocol = (location.protocol.startsWith('https')) ? 'wss' : 'ws';
        const url = `${protocol}://${location.host}${location.pathname}/ws`;
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
            this.emit('open');
        };

        this.socket.onclose = () => {
            this.emit('close');
        };

        this.socket.onerror = (event) => {
            this.emit('error', event);
        };

        this.socket.onmessage = (event) => {
            this.emit('message', JSON.parse(event.data));
        };
    }

    get connectionState() {
        switch (this.socket.readyState) {
            case WebSocket.CONNECTING:
                return "connecting";
            case WebSocket.OPEN:
                return "open";
            case WebSocket.CLOSING:
                return "closing";
            case WebSocket.CLOSED:
                return "closed";
            default:
                return "unknown";
        }
    }

    send(data) {
        this.socket.send(JSON.stringify(data));
    }

    sendReceive(data, responseParams) {
        // return a Promise that resolves when an appropriate response is received
        return new Promise((resolve) => {
            function matchResponse(message) {
                for (const key in responseParams) {
                    if (!(message.hasOwnProperty(key) && message[key] === responseParams[key])) {
                        return false;
                    }
                }
                return true;
            }

            const signaler = this;
            function onMessage(message) {
                if (matchResponse(message)) {
                    signaler.removeListener('message', onMessage);
                    resolve(message);
                }
            }

            signaler.on('message', onMessage);
            this.send(data);
        });
    }

    greeting() {
        const data = {'receiver': 'ground control',
                      'type': 'greeting',
                      'data': 'This is Major Tom to Ground Control: ' +
                              'I\'m stepping through the door. ' +
                              'And the stars look very different today.'};
        this.send(data);
    }

    shutdown() {
        if (this.socket.readyState === WebSocket.OPEN) {
            // Say bye to Ground Control
            const time = new Date().getTime();
            const data = {'receiver': 'ground control',
                        'type': 'bye',
                        'data': time};
            this.send(data);
        }

        // Shutdown socket
        this.socket.close(1000, 'goodbye');

        this.emit('shutdown');
    }
}

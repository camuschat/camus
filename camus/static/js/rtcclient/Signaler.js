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

    async ping() {
        const time = new Date().getTime();
        const data = {
            receiver: 'ground control',
            type: 'ping',
            data: time
        };
        const responseParams = {
            sender: 'ground control',
            type: 'pong',
            data: time
        };
        return await this.sendReceive(data, responseParams);
    }

    async get_room_info() {
        const data = {
            receiver: 'ground control',
            type: 'get-room-info'
        };
        const responseParams = {
            sender: 'ground control',
            type: 'room-info'
        };
        const response = await this.sendReceive(data, responseParams);
        return response.data;
    }

    async fetchIceServers() {
        const data = {
            receiver: 'ground control',
            type: 'get-ice-servers'
        }
        const responseParams = {
            sender: 'ground control',
            type: 'ice-servers'
        }
        const response = await this.sendReceive(data, responseParams);
        return response.data;
    }

    text(text, from, receiver, time) {
        receiver = ifDefined(receiver, 'room');
        time = ifDefined(time, new Date().getTime());
        this.send({
            receiver,
            type: 'text',
            data: {
                from,
                time,
                text
            }
        });
    }

    profile(username) {
        this.send({
            receiver: 'ground control',
            type: 'profile',
            data: { username }
        });
    }

    offer(receiver, description) {
        this.send({
            receiver,
            type: 'offer',
            data: description
        });
    }

    answer(receiver, description) {
        this.send({
            receiver,
            type: 'answer',
            data: description
        });
    }

    bye(receiver) {
        this.send({
            receiver,
            type: 'bye',
            data: new Date().getTime()
        });
    }

    icecandidate(receiver, candidate) {
        this.send({
            receiver,
            type: 'icecandidate',
            data: candidate
        });
    }

    greeting(receiver, text) {
        receiver = ifDefined(receiver, 'ground control');
        text = ifDefined(
            text,
            "This is Major Tom to Ground Control: I'm stepping through the " +
            "door. And the stars look very different today."
        );
        this.send({
            receiver,
            type: 'greeting',
            data: text
        });
    }

    shutdown() {
        if (this.socket.readyState === WebSocket.OPEN) {
            // Say bye to Ground Control
            this.bye('ground control');
        }

        // Shutdown socket
        this.socket.close(1000, 'goodbye');

        this.emit('shutdown');
    }
}

function ifDefined(item1, item2) {
    return item1 !== undefined ? item1 : item2;
}

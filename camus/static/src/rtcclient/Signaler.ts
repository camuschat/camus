import {
    Answer,
    IceCandidate,
    IceServer,
    Message,
    Offer,
    PongMessage,
    RoomInfo,
} from './types';
import EventEmitter from './EventEmitter';

export default class Signaler extends EventEmitter {
    socket: WebSocket;

    constructor() {
        super();
        this.connect = this.connect.bind(this);
        this.socket = this.connect();
    }

    connect(): WebSocket {
        const protocol = location.protocol.startsWith('https') ? 'wss' : 'ws';
        const url = `${protocol}://${location.host}${location.pathname}/ws`;
        const socket = new WebSocket(url);

        socket.onopen = () => {
            this.emit('open');
        };

        socket.onclose = () => {
            this.emit('close');
            setTimeout(this.connect, 5000);
        };

        socket.onerror = (event) => {
            this.emit('error', event);
            socket.close();
        };

        socket.onmessage = (event) => {
            this.emit('message', JSON.parse(event.data));
        };

        return socket;
    }

    get connectionState(): string {
        switch (this.socket.readyState) {
            case WebSocket.CONNECTING:
                return 'connecting';
            case WebSocket.OPEN:
                return 'open';
            case WebSocket.CLOSING:
                return 'closing';
            case WebSocket.CLOSED:
                return 'closed';
            default:
                return 'unknown';
        }
    }

    send(data: Message): void {
        this.socket.send(JSON.stringify(data));
    }

    sendReceive(data: Message, responseParams: object): Promise<Message> {
        // return a Promise that resolves when an appropriate response is received
        return new Promise((resolve) => {
            function matchResponse(message: Message) {
                for (const key in responseParams) {
                    if (
                        !(
                            key in message &&
                            (message as any)[key] ===
                                (responseParams as any)[key]
                        )
                    ) {
                        return false;
                    }
                }
                return true;
            }

            const signaler = this;
            function onMessage(message: Message) {
                if (matchResponse(message)) {
                    signaler.removeListener('message', onMessage);
                    resolve(message);
                }
            }

            signaler.on('message', onMessage);
            this.send(data);
        });
    }

    async ping(): Promise<PongMessage> {
        const time = new Date().getTime();
        const data = {
            receiver: 'ground control',
            type: 'ping',
            data: time,
        };
        const responseParams = {
            sender: 'ground control',
            type: 'pong',
            data: time,
        };
        const response = await this.sendReceive(data, responseParams);
        return response as PongMessage;
    }

    async getRoomInfo(): Promise<RoomInfo> {
        const data = {
            receiver: 'ground control',
            type: 'get-room-info',
        };
        const responseParams = {
            sender: 'ground control',
            type: 'room-info',
        };
        const response = await this.sendReceive(data, responseParams);
        return response.data as RoomInfo;
    }

    async fetchIceServers(): Promise<IceServer[]> {
        const data = {
            receiver: 'ground control',
            type: 'get-ice-servers',
        };
        const responseParams = {
            sender: 'ground control',
            type: 'ice-servers',
        };
        const response = await this.sendReceive(data, responseParams);
        return response.data as IceServer[];
    }

    text(text: string, from: string, receiver?: string, time?: number): void {
        receiver = receiver ? receiver : 'room';
        time = time ? time : new Date().getTime();
        this.send({
            receiver,
            type: 'text',
            data: {
                from,
                time,
                text,
            },
        });
    }

    profile(username: string): void {
        this.send({
            receiver: 'ground control',
            type: 'profile',
            data: { username },
        });
    }

    offer(receiver: string, description: Offer): void {
        this.send({
            receiver,
            type: 'offer',
            data: description,
        });
    }

    answer(receiver: string, description: Answer): void {
        this.send({
            receiver,
            type: 'answer',
            data: description,
        });
    }

    bye(receiver: string): void {
        this.send({
            receiver,
            type: 'bye',
            data: new Date().getTime(),
        });
    }

    icecandidate(receiver: string, candidate: IceCandidate): void {
        this.send({
            receiver,
            type: 'icecandidate',
            data: candidate,
        });
    }

    greeting(receiver?: string, text?: string): void {
        receiver = receiver ? receiver : 'ground control';
        text = text
            ? text
            : "This is Major Tom to Ground Control: I'm stepping through the " +
              'door. And the stars look very different today.';
        this.send({
            receiver,
            type: 'greeting',
            data: text,
        });
    }

    shutdown(): void {
        if (this.socket.readyState === WebSocket.OPEN) {
            // Say bye to Ground Control
            this.bye('ground control');
        }

        // Shutdown socket
        this.socket.close(1000, 'goodbye');

        this.emit('shutdown');
    }
}

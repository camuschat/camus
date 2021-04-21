import { Message } from './types';
import Manager from './Manager';
import Signaler from './Signaler';

export default class MessageHandler {
    manager: Manager;
    signaler: Signaler;
    messageListeners: [object, Function][];
    handlers: { [key: string]: Function };

    constructor(manager: Manager, signaler: Signaler) {
        this.manager = manager;
        this.signaler = signaler;
        this.messageListeners = [];
        this.handlers = {
            ping: this.ping,
            pong: this.pong,
            text: this.text,
            'get-room-info': this.getRoomInfo,
            'room-info': this.roomInfo,
            'get-ice-servers': this.getIceServers,
            'ice-servers': this.iceServers,
            profile: this.profile,
            offer: this.offer,
            answer: this.answer,
            icecandidate: this.iceCandidate,
            greeting: this.greeting,
            bye: this.bye,
        };
    }

    addMessageListener(messageParams: object, listener: Function): void {
        this.messageListeners.push([messageParams, listener]);
    }

    async handleMessage(message: Message): Promise<void> {
        const handler = this.handlers[message.type];
        if (handler) {
            handler.call(this, message);
        }
        await this.handlers[message.type].call(this, message);

        this.messageListeners.forEach(([messageParams, listener]) => {
            if (this.match(message, messageParams)) {
                listener(message);
            }
        });
    }

    async ping(message: Message): Promise<void> {
        console.log('<< Received ping: ', message);

        if (message.sender) {
            const response = this.emptyMessage();
            response.receiver = message.sender;
            response.type = 'pong';
            response.data = message.data;
            this.signaler.send(response);
        }
    }

    async pong(message: Message): Promise<void> {
        console.log('<< Received pong: ', message);
    }

    async text(message: Message): Promise<void> {
        console.log('<< Received text: ', message);
        this.manager.textMessages.push(message.data);
    }

    async getRoomInfo(message: Message): Promise<void> {
        console.log('<< Received get-room-info: ', message);
    }

    async roomInfo(message: Message): Promise<void> {
        console.log('<< Received room-info: ', message);
        this.manager.updatePeers(message.data);
    }

    async getIceServers(message: Message): Promise<void> {
        console.log('<< Received get-ice-servers: ', message);
    }

    async iceServers(message: Message): Promise<void> {
        console.log('<< Received ice-servers: ', message);
    }

    async profile(message: Message): Promise<void> {
        console.log('<< Received profile: ', message);
    }

    async offer(message: Message): Promise<void> {
        if (message.sender) {
            const peer = this.manager.getOrCreateMediaPeer({
                id: message.sender,
                username: 'Major Tom',
            });
            await peer.onOffer(message.data);
        }
    }

    async answer(message: Message): Promise<void> {
        if (message.sender) {
            const peer = this.manager.getOrCreateMediaPeer({
                id: message.sender,
                username: 'Major Tom',
            });
            await peer.onAnswer(message.data);
        }
    }

    async iceCandidate(message: Message): Promise<void> {
        if (message.sender) {
            const peer = this.manager.getOrCreateMediaPeer({
                id: message.sender,
                username: 'Major Tom',
            });
            const iceCandidate = new RTCIceCandidate(message.data);
            await peer.onIceCandidate(iceCandidate);
        }
    }

    async greeting(message: Message): Promise<void> {
        console.log('<< Received greeting: ', message);
    }

    async bye(message: Message): Promise<void> {
        console.log('<< Received bye: ', message);

        if (message.sender) {
            this.manager.removeMediaPeer(message.sender);
        }
    }

    emptyMessage(): Message {
        return {
            sender: '',
            receiver: '',
            type: '',
            data: '',
        };
    }

    match(message: Message, params: object): boolean {
        for (const key in params) {
            if (
                !(
                    key in message &&
                    (message as any)[key] === (params as any)[key]
                )
            ) {
                return false;
            }
        }
        return true;
    }
}

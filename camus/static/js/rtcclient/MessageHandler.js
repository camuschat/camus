export default class MessageHandler {
    constructor(manager, signaler) {
        this.manager = manager;
        this.signaler = signaler;
        this.messageListeners = [];
        this.handlers = {
            'ping': this.ping,
            'pong': this.pong,
            'text': this.text,
            'get-room-info': this.getRoomInfo,
            'room-info': this.roomInfo,
            'get-ice-servers': this.getIceServers,
            'ice-servers': this.iceServers,
            'profile': this.profile,
            'offer': this.offer,
            'answer': this.answer,
            'icecandidate': this.iceCandidate,
            'greeting': this.greeting,
            'bye': this.bye
        };
    }

    addMessageListener(messageParams, listener) {
        this.messageListeners.push([messageParams, listener]);
    }

    async handleMessage(message) {
        await this.handlers[message.type].call(this, message);

        this.messageListeners.forEach(([messageParams, listener]) => {
            if (this.match(message, messageParams)) {
                listener(message);
            }

        });
    }

    async ping(message) {
        console.log('<< Received ping: ', message);

        const response = this.emptyMessage();
        response.receiver = message.sender;
        response.type = 'pong';
        response.data = message.data;
        this.signaler.send(response);
    }

    async pong(message) {
        console.log('<< Received pong: ', message);
    }

    async text(message) {
        console.log('<< Received text: ', message);
        this.manager.textMessages.push(message.data);
    }

    async getRoomInfo(message) {
        console.log('<< Received get-room-info: ', message);
    }

    async roomInfo(message) {
        console.log('<< Received room-info: ', message);
        await this.manager.updatePeers(message.data);
    }

    async getIceServers(message) {
        console.log('<< Received get-ice-servers: ', message);
    }

    async iceServers(message) {
        console.log('<< Received ice-servers: ', message);
    }

    async profile(message) {
        console.log('<< Received profile: ', message);
    }

    async offer(message) {
        const peer = await this.manager.getOrCreateMediaPeer({id: message.sender, username: 'Major Tom'});
        if (message.type !== message.data.type){
            throw new Error('! Type mismatch in offer');
        }
        await peer.onOffer(message.data);
    }

    async answer(message) {
        const peer = await this.manager.getOrCreateMediaPeer({id: message.sender, username: 'Major Tom'});
        if (message.type !== message.data.type){
            throw new Error('! Type mismatch in answer');
        }
        await peer.onAnswer(message.data);
    }

    async iceCandidate(message) {
        const peer = await this.manager.getOrCreateMediaPeer({id: message.sender, username: 'Major Tom'});
        const iceCandidate = new RTCIceCandidate(message.data);
        await peer.onIceCandidate(iceCandidate);
    }

    async greeting(message) {
        console.log('<< Received greeting: ', message);
    }

    async bye(message) {
        console.log('<< Received bye: ', message);

        const client_id = message.sender;
        this.manager.removeMediaPeer(client_id);
    }

    emptyMessage() {
        return {sender: '',
                receiver: '',
                type: '',
                data: ''};
    }

    match(message, params) {
        for (const key in params) {
            if (!(message.hasOwnProperty(key) && message[key] === params[key])) {
                return false;
            }
        }
        return true;
    }
}

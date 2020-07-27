'use strict';

import adapter from 'webrtc-adapter';  // eslint-disable-line no-unused-vars

class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    listeners(event) {
        return this.events.get(event) || [];
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }

        this.events.get(event).push(callback);
    }

    removeListener(event, callback) {
        const listeners = this.events.get(event);
        if (listeners && listeners.includes(callback)) {
            const index = listeners.indexOf(callback);
            listeners.splice(index, 1);
        }
    }

    emit(event, ...args) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            callbacks.forEach((callback) => {
                callback(...args);
            });
        }
    }
}


class VideoPeer extends EventEmitter {
    constructor(client, signaler, polite, iceServers=[]) {
        super();
        this.client_id = client.id;
        this.username = client.username;
        this.signaler = signaler;
        this.polite = polite;
        this.connection = null;
        this.makingOffer = false;

        this.createPeerConnection(iceServers);
    }

    createPeerConnection(iceServers) {
        const config = {
            sdpSemantics: 'unified-plan',
            iceServers: iceServers,
        };
        this.connection = new RTCPeerConnection(config);

        // Handle incoming tracks from the peer
        this.connection.ontrack = ({track, streams}) => {
            console.log(`[${this.client_id}] ${track.kind} track ${track.id} received`);
            this.emit('track', track, streams);
        };

        this.connection.onconnectionstatechange = () => {
            console.log(`[${this.client_id}] Connection state: ${this.connection.connectionState}`);
            this.emit('connectionstatechange', this.connection.connectionState);
        };

        // Handle failed ICE connections
        this.connection.oniceconnectionstatechange = () => {
            console.log(`[${this.client_id}] Ice connection state: ${this.connection.iceConnectionState}`);
            if (this.connection.iceConnectionState === "failed") {
                this.connection.restartIce();
            }

            this.emit('iceconnectionstatechange', this.connection.iceConnectionState);
        };

        this.connection.onsignalingstatechange = () => {
            console.log(`[${this.client_id}] Signaling state: ${this.connection.signalingState}`);
        };

        this.connection.onicegatheringstatechange = () => {
            console.log(`[${this.client_id}] Ice gathering state: ${this.connection.iceGatheringState}`);
        };

        // Handle (re)negotiation of the connection
        this.connection.onnegotiationneeded = async () => {
            console.log(`[${this.client_id}] onnegotiationneeded`);

            try {
                this.makingOffer = true;
                const offer = await this.connection.createOffer();
                if (this.connection.signalingState !== 'stable') return;
                await this.connection.setLocalDescription(offer);
                const description = this.connection.localDescription.toJSON();
                this.signaler.send({
                    receiver: this.client_id,
                    type: description.type,
                    data: description
                });
            } catch(err) {
                console.error(err);
            } finally {
                this.makingOffer = false;
            }
        };

        // Send ICE candidates as they are gathered
        this.connection.onicecandidate = ({candidate}) => {
            if (candidate) {
                this.signaler.send({
                    receiver: this.client_id,
                    type: 'icecandidate',
                    data: candidate.toJSON()
                });
            }
        };
    }

    connect() {
        // Adding transceivers triggers onnegotiationneeded()
        this.connection.addTransceiver('video');
        this.connection.addTransceiver('audio');
    }

    get connectionState() {
        return this.connection.connectionState;
    }

    get iceConnectionState() {
        return this.connection.iceConnectionState;
    }

    get iceGatheringState() {
        return this.connection.iceGatheringState;
    }

    get signalingState() {
        return this.connection.signalingState;
    }

    remoteDescription() {
        const description = this.connection.remoteDescription;
        if (description) {
            return description.sdp;
        } else {
            return null;
        }
    }

    async onOffer(offer) {
        /* Perfect negotiation:
         * 1. If we are ready to accept the offer (i.e. we're not in the process of making our
         *    own offer), then set the remote description with the offer.
         * 2. Otherwise, there is an "offer collision". If we are the impolite peer, ignore the
         *    offer. If we are polite, roll back the local description and set the remote
         *    description with the offer.
         * 3. If we aren't ignoring the offer, respond to the peer with an answer.
         */

        console.log(`[${this.client_id}] Processing offer`);
        if (offer.type !== 'offer') {
            throw new Error('type mismatch');
        }

        try {
            const offerCollision = this.makingOffer || this.connection.signalingState !== 'stable';
            console.log(`[${this.client_id}] ? Polite: ${this.polite}`);

            if (offerCollision) {
                if (!this.polite) {
                    console.log(`[${this.client_id}] Reject offer`);
                    return;
                }

                // Polite peer rolls back local description and accepts remote offer
                await Promise.all([
                    this.connection.setLocalDescription({type: "rollback"}),
                    this.connection.setRemoteDescription(offer)
                ]);

            } else {
                // No collision, so accept the remote offer
                await this.connection.setRemoteDescription(offer);
            }

            // Create an answer to the remote offer and send it
            const answer = await this.connection.createAnswer();
            await this.connection.setLocalDescription(answer);

            const description = this.connection.localDescription.toJSON();
            console.log(`[${this.client_id}] Respond to offer`);
            this.signaler.send({
                receiver: this.client_id,
                type: description.type,
                data: description
            });
        } catch(err) {
            console.error(err);
        }
    }

    async onAnswer(answer) {
        console.log(`[${this.client_id}] Processing answer`);

        try {
            await this.connection.setRemoteDescription(answer);
        } catch(err) {
            console.error(err);
        }
    }

    async onIceCandidate(candidate) {
        try {
            await this.connection.addIceCandidate(candidate);
        } catch(err) {
            console.error(err);
        }
    }

    async setTrack(track, stream=null) {
        const trackSender = this.connection.getSenders().find(sender =>
            sender.track && sender.track.kind === track.kind);

        if (trackSender) {
            console.log('Replacing track on sender ', trackSender);
            trackSender.track.stop();
            await trackSender.replaceTrack(track);
        } else {
            if (stream) this.connection.addTrack(track, stream);
            else this.connection.addTrack(track);
        }
    }

    getTrack(kind) {
        const trackSender = this.connection.getSenders().find(sender =>
            sender.track && sender.track.kind === kind);

        if (trackSender) return trackSender.track;
        else return null;
    }

    restartIce() {
        this.connection.restartIce();
    }

    shutdown() {
        // Clean up RTCPeerConnection
        if (this.connection !== null) {
            this.connection.getReceivers().forEach(receiver => {
                if(receiver.track) receiver.track.stop();
            });

            this.connection.close();
        }

        // Say bye to peer
        const time = new Date().getTime();
        const data = {"receiver": this.client_id,
                      "type": "bye",
                      "data": time};
        this.signaler.send(data);

        this.emit('shutdown');

        console.log('Shutdown connection with peer ' + this.client_id);
    }
}

class Signaler extends EventEmitter {
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
        if (data.type === 'offer' || data.type === 'answer' || data.type === 'icecandidate') {
            console.log(`>> Sent ${data.type}: `, data);
        }
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


class MessageHandler {
    constructor(manager, signaler) {
        this.manager = manager;
        this.signaler = signaler;
        this.messageListeners = [];
        this.handlers = {'ping': this.ping,
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
        console.log('<< Received offer: ', message);

        const peer = await this.manager.getOrCreateVideoPeer({id: message.sender, username: 'Major Tom'});
        if (message.type !== message.data.type){
            throw new Error('! Type mismatch in offer');
        }
        await peer.onOffer(message.data);
    }

    async answer(message) {
        console.log('<< Received answer: ', message);

        const peer = await this.manager.getOrCreateVideoPeer({id: message.sender, username: 'Major Tom'});
        if (message.type !== message.data.type){
            throw new Error('! Type mismatch in answer');
        }
        await peer.onAnswer(message.data);
    }

    async iceCandidate(message) {
        console.log('<< Received icecandidate: ', message);

        const peer = await this.manager.getOrCreateVideoPeer({id: message.sender, username: 'Major Tom'});
        const iceCandidate = new RTCIceCandidate(message.data);
        await peer.onIceCandidate(iceCandidate);
    }

    async greeting(message) {
        console.log('<< Received greeting: ', message);
    }

    async bye(message) {
        console.log('<< Received bye: ', message);

        const client_id = message.sender;
        if (this.manager.videoPeers.has(client_id)) {
            this.manager.videoPeers.get(client_id).shutdown();
            this.manager.videoPeers.delete(client_id);
        }
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

class Manager extends EventEmitter {
    constructor() {
        super();
        this.username = 'Major Tom';
        this.signaler = new Signaler();
        this.videoPeers = new Map();
        this.localVideoStream = null;
        this.videoTrack = null;
        this.audioTrack = null;
        this.textMessages = [];
        this.messageHandler = new MessageHandler(this, this.signaler);
        this.id = null;
        this.iceServers = [];
    }

    setUsername(username) {
        this.username = username;

        const data = {receiver: 'ground control',
                      type: 'profile',
                      data: {username: this.username}
        };
        this.signaler.send(data);
    }

    async setAudioTrack(track) {
        await this.setTrack(track);
        this.audioTrack = track;
    }

    async setVideoTrack(track) {
        await this.setTrack(track);
        this.videoTrack = track;
    }

    async setTrack(track) {
        for (let peer of this.videoPeers.values()) {
            await peer.setTrack(track, this.localVideoStream);
        }
    }

    get audioEnabled() {
        return this.audioTrack && this.audioTrack.enabled;
    }

    set audioEnabled(enabled) {
        if (this.audioTrack) this.audioTrack.enabled = enabled;
    }

    get videoEnabled() {
        return this.videoTrack && this.videoTrack.enabled;
    }

    set videoEnabled(enabled) {
        if (this.videoTrack) this.videoTrack.enabled = enabled;
    }

    stopAudio() {
        if (this.audioTrack) {
            this.audioTrack.enabled = false;
            this.audioTrack.stop();
        }
    }

    stopVideo() {
        if (this.videoTrack) {
            this.videoTrack.enabled = false;
            this.videoTrack.stop();
        }
    }

    async createVideoPeer(client) {
        const peer = new VideoPeer(client, this.signaler, this.id < client.id, this.iceServers);
        this.videoPeers.set(client.id, peer);
        peer.connect();

        if (this.localVideoStream && this.videoTrack) {
            await peer.setTrack(this.videoTrack, this.localVideoStream);
        }

        if (this.localVideoStream && this.audioTrack) {
            await peer.setTrack(this.audioTrack, this.localVideoStream);
        }

        console.log('Created video peer ', peer.client_id);
        this.emit('videopeer', peer);

        return peer;
    }

    async getOrCreateVideoPeer(client) {
        if (!this.videoPeers.has(client.id)) {
            return await this.createVideoPeer(client);
        }

        return this.videoPeers.get(client.id);
    }

    async findPeers() {
        const roomInfo = await this.get_room_info();
        await this.updatePeers(roomInfo);
    }

    async updatePeers(roomInfo) {
        // Remove peers not in room
        const roomClientIds = roomInfo.clients.map(({id}) => id);
        const peerClientIds = Array.from(this.videoPeers.keys());
        const removeIds = peerClientIds.filter(id => !roomClientIds.includes(id));

        removeIds.forEach((clientId) => {
            const peer = this.videoPeers.get(clientId);
            peer.shutdown();
            this.videoPeers.delete(clientId);
            console.log('Removed client ', clientId);
        });

        // Add peers in room
        for (const client of roomInfo.clients) {
            if (client.id !== this.id) {
                await this.getOrCreateVideoPeer(client);
            }
        }

        // Update information for each peer
        this.videoPeers.forEach((peer, peer_id) => {
            const oldUsername = peer.username;
            const client = roomInfo.clients.find(client => client.id === peer_id);
            if (client) {
                peer.username = client.username;
            }
        });
    }

    addMessageListener(messageParams, listener) {
        this.messageHandler.addMessageListener(messageParams, listener);
    }

    shutdownVideoPeers() {
        this.videoPeers.forEach((peer) => {
            peer.shutdown();
        });

        this.videoPeers.clear();
    }

    async get_self_id() {
        const time = new Date().getTime();
        const data = {"receiver": "ground control",
                    "type": "ping",
                    "data": time};
        const responseParams = {"sender": "ground control",
                            "type": "pong",
                            "data": time};
        const response = await this.signaler.sendReceive(data, responseParams);
        return response.receiver;

    }

    async get_room_info() {
        const data = {"receiver": "ground control",
                    "type": "get-room-info"};
        const responseParams = {"sender": "ground control",
                              "type": "room-info"};
        const response = await this.signaler.sendReceive(data, responseParams);
        return response.data;
    }

    async getIceServers() {
        const data = {
            'receiver': 'ground control',
            'type': 'get-ice-servers'
        }
        const responseParams = {
            'sender': 'ground control',
            'type': 'ice-servers'
        }
        const response = await this.signaler.sendReceive(data, responseParams);
        return response.data;
    }

    shutdown() {
        this.shutdownVideoPeers();
        this.signaler.shutdown();
    }

    async start() {
        // Set up message handler
        this.signaler.on('message', (message) => {
            this.messageHandler.handleMessage(message);
        });

        // Wait for websocket to open
        while (this.signaler.connectionState != 'open') {
            await new Promise(r => {setTimeout(r, 100)});
        }

        this.id = await this.get_self_id();
        this.iceServers = await this.getIceServers();
        await this.findPeers();
    }
}

export {Manager, Signaler, VideoPeer, EventEmitter};

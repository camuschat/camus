'use strict';

window.addEventListener('unhandledrejection', function(event) {
    console.log('An unhandled error occurred');
    console.log(event.promise);
    console.log(event.reason);

    //alert('An unrecoverable error occurred. Please refresh the page to re-join the room.');
});

class VideoPeer {
    constructor(client, groundControl) {
        this.client_id = client.id;
        this.username = client.username;
        this.groundControl = groundControl;
        this.connection = null;
    }

    async createPeerConnection() {
        let config = {
            sdpSemantics: 'unified-plan'
        };
        config.iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
        this.connection = new RTCPeerConnection(config);

        this.connection.addEventListener('iceconnectionstatechange', () => {
            console.log("Ice connection state <" + this.connection.iceConnectionState + "> for client " + this.client_id);
        });

        // Handle incoming tracks from the peer
        this.connection.ontrack = ({track, streams}) => {
            console.log(`${track.kind} track ${track.id} received from client ${this.client_id}`);

            if (track.kind === 'video') {
                track.onunmute = () => {
                    createVideoElement(this.client_id); // TODO: Movie to ui.js
                    attachVideoElement(this.client_id, streams[0]);
                };
            }
        };

        // Handle re-negotiation of the connection
        const connection = this.connection;
        const groundControl = this.groundControl;
        const client_id = this.client_id;
        let makingOffer = false;
        this.connection.onnegotiationneeded = async () => {
            return;
            try {
                makingOffer = true;
                await connection.setLocalDescription();
                const data = {"receiver": client_id,
                              "type": "offer",
                              "data": connection.localDescription.sdp};
                await groundControl.sendMessage(data);
            } catch(err) {
                console.error(err);
            } finally {
                makingOffer = false;
            }
        };

        // Send ICE candidates as they are ready
        this.connection.onicecandidate = async ({candidate}) => {
            const data = {"receiver": client_id,
                          "type": "icecandidate",
                          "data": candidate};
            //await groundControl.sendMessage(data);
        }
    }

    connectionState() {
        return this.connection.connectionState;
    }

    iceConnectionState() {
        return this.connection.iceConnectionState;
    }

    signalingState() {
        return this.connection.signalingState;
    }

    remoteDescription() {
        let description = this.connection.remoteDescription;
        if (description) {
            return description.sdp;
        } else {
            return null;
        }
    }

    onOffer() {
    }

    onIceCandidate () {
        //if this.makingOffer
    }

    async respondToOffer(offer) {
        // Set the remote description with the offer
        await this.connection.setRemoteDescription(offer);

        // Create an answer and send it to the peer via Ground Control
        let answer = await this.connection.createAnswer();
        await this.connection.setLocalDescription(answer);

        const data = {"receiver": this.client_id,
                      "type": "answer",
                      "data": this.connection.localDescription.sdp};
        await this.groundControl.sendMessage(data);
    }

    async negotiateConnection(peeroffer=null) {
        // TODO: implement perfect negotiation
        // https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
        if (peeroffer !== null) {
            return this.respondToOffer(peeroffer);
        }

        // Create offer for peer
        const offer = await this.connection.createOffer();
        await this.connection.setLocalDescription(offer);

        // Wait for ice gathering to complete
        while (this.connection.iceGatheringState != 'complete') {
            await new Promise(r => setTimeout(r, 100));
        }

        // Make an offer and wait for the answer
        const data = {"receiver": this.client_id,
                      "type": "offer",
                      "data": this.connection.localDescription.sdp};
        let responseParams = {"sender": this.client_id,
                              "type": "answer"};
        let response = await this.groundControl.sendReceiveMessage(data, responseParams);
        let answer = {'type': 'answer', 'sdp': response.data};
        return await this.connection.setRemoteDescription(answer);
    }

    addTrack(track, stream) {
        console.log('In VideoPeer.addTrack()');
        this.connection.addTrack(track, stream);
    }

    setTrack(track) {
        let trackSender = this.connection.getSenders().find(sender =>
            sender.track.kind === track.kind);

        if (trackSender) {
            console.log('Replacing track on sender ', trackSender);
            trackSender.track.stop();
            trackSender.replaceTrack(track);
        } else {
            this.connection.addTrack(track);
        }
    }

    async shutdown() {
        if (this.connection !== null) {
            this.connection.getReceivers().forEach(receiver => {
                receiver.track.stop();
            });

            this.connection.close();
            this.connection = null;
        }

        let videoelement = document.getElementById('video-' + this.client_id);
        videoelement.remove();

        const time = new Date().getTime();
        const data = {"receiver": this.client_id,
                      "type": "bye",
                      "data": time};
        await this.groundControl.sendMessage(data);

        console.log('Shutdown connection with peer ' + this.client_id);
    }
}

class GroundControl {
    constructor() {
        this.connection = null;
        this.datachannel = null;
        this.createConnection();
    }

    createConnection() {
        let config = {
            sdpSemantics: 'unified-plan'
        };
        config.iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
        this.connection = new RTCPeerConnection(config);

        this.connection.addEventListener('iceconnectionstatechange', () => {
            console.log("Ice connection state:", this.connection.iceConnectionState);
            if (this.connection.iceConnectionState === "failed") {
                this.connection.restartIce();
            }
        });

        this.datachannel = this.connection.createDataChannel('data');
        this.datachannel.onopen = function(evt) {
            greeting()
        };

        console.log('Connection for Ground Control created');
    }

    connectionState() {
        return this.connection.iceConnectionState;
    }

    async offer() {
        console.log('In groundControl.offer()');
        // Create offer for Ground Control
        const offer = await this.connection.createOffer();
        console.log('created offer', offer);
        await this.connection.setLocalDescription(offer);
        console.log('set local description', this.connection.localDescription);

        // Wait for ice gathering to complete
        while (this.connection.iceGatheringState != 'complete') {
            await new Promise(r => setTimeout(r, 100));
        }

        console.log('ice gathering complete');

        // Send the offer and wait for the answer
        console.log('Posting offer to ' + document.URL + '/offer');
        const response = await fetch(document.URL + '/offer', {
            body: JSON.stringify({sdp: this.connection.localDescription.sdp,
                                  type: this.connection.localDescription.type}),
            headers: {'Content-Type': 'application/json'},
            method: 'POST'
        });
        const answer = await response.json();
        await this.connection.setRemoteDescription(answer);
    }

    async sendMessage(data) {
        this.datachannel.send(JSON.stringify(data));
        console.log('Sent message to Ground Control:', data);
    }

    async sendReceiveMessage(data, responseParams) {
        // return a Promise that resolves when an appropriate response is received
        return new Promise((resolve, reject) => {
            function matchResponse(message) {
                for (const key in responseParams) {
                    if (!(message.hasOwnProperty(key) && message[key] === responseParams[key])) {
                        return false;
                    }
                }
                return true;
            }

            let dc = this.datachannel;  // needed to access the datachannel inside the closure
            function onMessage(evt) {
                let message = JSON.parse(evt.data);
                if (matchResponse(message)) {
                    console.log('Received valid response message:', message);
                    dc.removeEventListener('message', onMessage);
                    resolve(message);
                }
            }

            this.datachannel.addEventListener('message', onMessage);
            this.sendMessage(data);
        });
    }

    async shutdown() {
        // Stop media tracks
        this.connection.getReceivers().forEach(receiver => {
            receiver.track.stop();
        });

        // Say bye to Ground Control
        const time = new Date().getTime();
        const data = {"receiver": "ground control",
                    "type": "bye",
                    "data": time};
        await this.sendMessage(data);

        // Shutdown connections
        this.connection.close();
        this.connection = null;
        this.datachannel = null;

        console.log('Shutdown connection with Ground Control ');
    }
}

async function ping() {
    const time = new Date().getTime();
    const data = {"receiver": "ground control",
                  "type": "ping",
                  "data": time};
    manager.groundControl.sendMessage(data);
}

async function get_self_id() {
    const time = new Date().getTime();
    let data = {"receiver": "ground control",
                "type": "ping",
                "data": time};
    let responseParams = {"sender": "ground control",
                          "type": "pong",
                          "data": time};
    let response = await manager.groundControl.sendReceiveMessage(data, responseParams);
    return response.receiver;

}

async function get_room_info() {
    let data = {"receiver": "ground control",
                "type": "get-room-info"};
    let responseParams = {"sender": "ground control",
                          "type": "room-info"};
    let response = await manager.groundControl.sendReceiveMessage(data, responseParams);
    return response.data;
}

async function greeting() {
    const data = {"receiver": "ground control",
                  "type": "greeting",
                  "data": "This is Major Tom to Ground Control: I'm stepping through the door. And the stars look very different today."};
    manager.groundControl.sendMessage(data);
}

async function postJson(url, body) {
    request = {
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'},
        method: 'POST'
    }
    return fetch(request)
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
                         'profile': this.profile,
                         'offer': this.offer,
                         'answer': this.answer,
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
                console.log('Calling listener for message: ', message);
                listener(message);
            }

        });
    }

    async ping(message) {
        console.log('<< Received ping: ', message);

        console.log('this: ', this);
        let response = this.emptyMessage();
        response.receiver = message.sender;
        response.type = 'pong';
        response.data = message.data;
        await this.signaler.sendMessage(response);

        console.log('>> Sent pong: ', message);
    }

    async pong(message) {
        console.log('<< Received pong: ', message);
    };

    async text(message) {
        console.log('<< Received text: ', message);
        manager.textMessages.push(message.data);
    }

    async getRoomInfo(message) {
        console.log('<< Received get-room-info: ', message);
    }

    async roomInfo(message) {
        console.log('<< Received room-info: ', message);
        await manager.updatePeers(message.data);
    }

    async profile(message) {
        console.log('<< Received profile: ', message);
    }

    async offer(message) {
        console.log('<< Received offer: ', message);

        // TODO: perfect negotiation
        const sessionDesc = {'type': 'offer', 'sdp': message.data};
        const offer = new RTCSessionDescription(sessionDesc);
        const client = {id: message.sender, username: 'Major Tom'};
        await manager.getOrCreateVideoPeer(client, offer);
    }

    async answer(message) {
        console.log('<< Received answer: ', message);
    }

    async greeting(message) {
        console.log('<< Received greeting: ', message);
    }

    async bye(message) {
        console.log('<< Received bye: ', message);

        let client_id = message.sender;
        if (manager.videoPeers.has(client_id)) {
            await manager.videoPeers.get(client_id).shutdown()
            manager.videoPeers.delete(client_id)
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

class Manager {
    constructor() {
        this.username = 'Major Tom';
        this.groundControl = new GroundControl();
        this.videoPeers = new Map();
        this.localVideoStream = null;
        this.videoTrack = null;
        this.audioTrack = null;
        this.textMessages = [];
        this.messageHandler = new MessageHandler(this, this.groundControl);
        this.outbox = [];
        console.log('Created Manager')
    }

    async setUsername(username) {
        this.username = username;

        const data = {receiver: 'ground control',
                      type: 'profile',
                      data: {username: this.username}
        };
        await this.groundControl.sendMessage(data);
        console.log('Set username in manager: ', this.username);
    }

    setAudioTrack(track) {
        this.setTrack(track);
        this.audioTrack = track;
    }

    setVideoTrack(track) {
        this.setTrack(track);
        this.videoTrack = track;
    }

    setTrack(track) {
        this.videoPeers.forEach((peer, peer_id) => {
            console.log('Replace ' + track.kind + ' track for peer ' + peer_id);
            peer.setTrack(track);
        });
    }

    toggleAudio() {
        if (this.audioTrack) {
            this.audioTrack.enabled = !this.audioTrack.enabled;
            console.log(this.audioTrack.kind + ' enabled: ' + this.audioTrack.enabled);
        }
    }

    audioEnabled() {
        return this.audioTrack && this.audioTrack.enabled;
    }

    async establishGroundControl() {
        await this.groundControl.offer();
        return this.groundControl;
    }

    async createVideoPeer(client, offer=null) {
        let peer = new VideoPeer(client, this.groundControl);
        this.videoPeers.set(client.id, peer);
        await peer.createPeerConnection();

        peer.addTrack(this.videoTrack, this.localVideoStream);
        peer.addTrack(this.audioTrack, this.localVideoStream);

        await peer.negotiateConnection(offer);

        console.log('Created video peer ', peer.client_id);
    }

    async getOrCreateVideoPeer(client, offer=null) {
        if (!this.videoPeers.has(client.id)) {
            return await this.createVideoPeer(client, offer);
        }

        return this.videoPeers.get(client.id);
    }

    async findPeers() {
        let roomInfo = await get_room_info();
        await this.updatePeers(roomInfo);
    }

    async updatePeers(roomInfo) {
        console.log('In Manager.updatePeers()');
        // Remove peers not in room
        let roomClientIds = roomInfo.clients.map(({id, username}) => id);
        let peerClientIds = Array.from(this.videoPeers.keys());
        let removeIds = peerClientIds.filter(id => !roomClientIds.includes(id));

        console.log('roomClientIds: ', roomClientIds);
        console.log('peerClientIds: ', peerClientIds);
        console.log('removeIds: ', removeIds);

        let manager = this;  // needed to access the manager inside the closure
        removeIds.forEach(async function(clientId) {
            let peer = this.videoPeers.get(clientId);
            await peer.shutdown();
            manager.videoPeers.delete(clientId);
            console.log('Removed client ', clientId);
        });

        // Add peers in room
        let self_id = await get_self_id();
        roomInfo.clients.forEach(async function(client) {
            if (client.id !== self_id) {
                await manager.getOrCreateVideoPeer(client);
            }
        });

        // Update information for each peer
        this.videoPeers.forEach((peer, peer_id) => {
            let oldUsername = peer.username;
            let client = roomInfo.clients.find(client => client.id === peer_id);
            peer.username = client.username;
            console.log('Set peer username from ' + oldUsername + ' to ' + peer.username);
        });
    }

    addMessageListener(messageParams, listener) {
        this.messageHandler.addMessageListener(messageParams, listener);
    }

    async shutdownVideoPeers() {
        this.videoPeers.forEach(async function(peer, peer_id) {
            await peer.shutdown();
        });

        this.videoPeers.clear();
    }

    async shutdown() {
        await this.shutdownVideoPeers();
        await this.groundControl.shutdown();
    }

    async start() {
        const groundControlPromise = this.establishGroundControl();

        const constraints = {
            audio: true,
            video: true
        }
        //const constraints = {
        //    audio: true,
        //    video: {
        //        width: {max: 640},
        //        height: {max: 480},
        //        frameRate: {max: 10}
        //    }
        //}
        const streamPromise = navigator.mediaDevices.getUserMedia(constraints);

        await groundControlPromise;
        this.groundControl.datachannel.addEventListener('message', (evt) => {
            this.messageHandler.handleMessage(JSON.parse(evt.data));
        });

        this.localVideoStream = await streamPromise;
        this.videoTrack = this.localVideoStream.getTracks().find(track => track.kind === 'video');
        this.audioTrack = this.localVideoStream.getTracks().find(track => track.kind === 'audio');
        createVideoElement('local');
        attachVideoElement('local', this.localVideoStream);  // TODO: move to ui.js

        // Wait for data channel to open
        while (this.groundControl.datachannel.readyState != 'open') {
            await new Promise(r => setTimeout(r, 100));
        }
        let peers = await this.findPeers();
    }
}

window.addEventListener('beforeunload', async function(event) {
    await manager.shutdown();
});


async function start() {
    await manager.start()
    startUI();
}

var manager = new Manager();
start();

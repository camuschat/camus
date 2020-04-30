'use strict';

class VideoPeer {
    constructor(client_id, groundControl) {
        this.client_id = client_id;
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
            console.log("Ice connection state:", this.connection.iceConnectionState);
        });

        this.connection.addEventListener('track', (evt) => {
            // TODO: what's in evt.streams?
            if (evt.track.kind == 'video') {
                console.log('Video track received:', evt.track.id)
                attachVideoElement('video-' + this.client_id, evt.streams[0]);
            }
            else {
                console.log('Audio track received:', evt.track.id)
            }
        });

        this.connection = this.connection;
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
        });

        this.datachannel = this.connection.createDataChannel('data');
        this.datachannel.onopen = function(evt) {
            greeting()
        };

        console.log('Connection for Ground Control created');
    }

    async offer() {
        // Create offer for Ground Control
        const offer = await this.connection.createOffer();
        await this.connection.setLocalDescription(offer);

        // Wait for ice gathering to complete
        while (this.connection.iceGatheringState != 'complete') {
            await new Promise(r => setTimeout(r, 100));
        }

        // Send the offer and wait for the answer
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
                          "type": "get-room-info"};
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

class Manager {
    constructor() {
        this.groundControl = new GroundControl();
        this.videoPeers = new Map();
        this.localVideoStream = null;
        this.videoTrack = null;
        this.audioTrack = null;
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

    async createVideoPeer(client_id, offer=null) {
        let peer = new VideoPeer(client_id, this.groundControl);
        this.videoPeers.set(client_id, peer);
        createVideoElement('video-' + client_id); // TODO: Movie to ui.js
        await peer.createPeerConnection();

        peer.addTrack(this.videoTrack, this.localVideoStream);
        peer.addTrack(this.audioTrack, this.localVideoStream);
        //for (const track of this.localVideoStream.getTracks()) {
        //    peer.addTrack(track, this.localVideoStream);
        //}

        await peer.negotiateConnection(offer);
    }

    async getOrCreateVideoPeer(client_id, offer=null) {
        if (!this.videoPeers.has(client_id)) {
            return await this.createVideoPeer(client_id, offer);
        }

        return this.videoPeers.get(client_id);
    }

    async findPeers() {
        let self_id = await get_self_id();
        let room_info = await get_room_info();

        let manager = this;  // needed to access the manager inside the closure
        room_info.clients.forEach(async function(client_id) {
            if (client_id === self_id) {
                return;
            }

            // TODO: gross
            let peer = manager.getOrCreateVideoPeer(client_id);
        });
    }

    async processMessage(evt) {
        // TODO: processMessage() is used as a callback, so we can't use this, which is ugly
        let message = JSON.parse(evt.data);
        console.log('Processing message:', message);

        if (message.type === 'offer') {
            let sessionDesc = {'type': 'offer', 'sdp': message.data};
            let offer = new RTCSessionDescription(sessionDesc);
            let peer = await manager.getOrCreateVideoPeer(message.sender, offer);
        } else if (message.type == 'ping') {
            const data = {"receiver": message.sender,
                        "type": "pong",
                        "data": message.data};
            await manager.groundControl.sendMessage(data);

        } else if (message.type == 'bye') {
            let client_id = message.sender;
            if (manager.videoPeers.has(client_id)) {
                await manager.videoPeers.get(client_id).shutdown()
                manager.videoPeers.delete(client_id)
            }
        }
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
        const streamPromise = navigator.mediaDevices.getUserMedia(constraints);

        this.groundControl = await groundControlPromise;
        this.groundControl.datachannel.addEventListener('message', this.processMessage);

        this.localVideoStream = await streamPromise;
        this.videoTrack = this.localVideoStream.getTracks().find(track => track.kind === 'video');
        this.audioTrack = this.localVideoStream.getTracks().find(track => track.kind === 'audio');
        attachVideoElement('video-local', this.localVideoStream);  // TODO: move to ui.js

        // Wait for data channel to open
        while (this.groundControl.datachannel.readyState != 'open') {
            await new Promise(r => setTimeout(r, 100));
        }
        let peers = await this.findPeers();
    }
}

window.addEventListener('beforeunload', async function(event) {
    await shutdown();
});

var manager = new Manager();
manager.start()

'use strict';

var groundControl = null;
var videoPeers = new Map();
var localstream = null;

class VideoPeer {
    constructor(client_id) {
        this.client_id = client_id;
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
        await this.connection.setRemoteDescription(offer);
        let answer = await this.connection.createAnswer();
        await this.connection.setLocalDescription(answer);

        const data = {"receiver": this.client_id,
                      "type": "answer",
                      "data": this.connection.localDescription.sdp};
        await groundControl.sendMessage(data);
    }

    async negotiateConnection(peeroffer=null) {
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
        let response = await groundControl.sendReceiveMessage(data, responseParams);
        let answer = {'type': 'answer', 'sdp': response.data};
        return await this.connection.setRemoteDescription(answer);
    }

    addTrack(track, stream) {
        this.connection.addTrack(track, stream);
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
        await groundControl.sendMessage(data);

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
        this.connection.getReceivers().forEach(receiver => {
            receiver.track.stop();
        });

        const time = new Date().getTime();
        const data = {"receiver": "ground control",
                    "type": "bye",
                    "data": time};
        await this.sendMessage(data);

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
    groundControl.sendMessage(data);
}

async function get_self_id() {
    const time = new Date().getTime();
    let data = {"receiver": "ground control",
                "type": "ping",
                "data": time};
    let responseParams = {"sender": "ground control",
                          "type": "pong",
                          "data": time};
    let response = await groundControl.sendReceiveMessage(data, responseParams);
    return response.receiver;

}

async function get_room_info() {
    let data = {"receiver": "ground control",
                "type": "get-room-info"};
    let responseParams = {"sender": "ground control",
                          "type": "get-room-info"};
    let response = await groundControl.sendReceiveMessage(data, responseParams);
    return response.data;
}

async function greeting() {
    const data = {"receiver": "ground control",
                  "type": "greeting",
                  "data": "This is Major Tom to Ground Control: I'm stepping through the door. And the stars look very different today."};
    groundControl.sendMessage(data);
}

async function postJson(url, body) {
    request = {
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'},
        method: 'POST'
    }
    return fetch(request)
}

async function establishGroundControl() {
    const groundControl = new GroundControl();
    await groundControl.offer();
    return groundControl;
}

async function createVideoPeer(client_id, offer=null) {
    let peer = new VideoPeer(client_id);
    videoPeers.set(client_id, peer);
    createVideoElement('video-' + client_id);
    await peer.createPeerConnection();

    for (const track of localstream.getTracks()) {
        peer.addTrack(track, localstream);
    }

    await peer.negotiateConnection(offer);
}

async function getOrCreateVideoPeer(client_id, offer=null) {
    if (!videoPeers.has(client_id)) {
        return await createVideoPeer(client_id, offer);
    }

    return videoPeers.get(client_id);
}

async function findPeers() {
    let self_id = await get_self_id();
    let room_info = await get_room_info();

    room_info.clients.forEach(async function(client_id) {
        if (client_id === self_id) {
            return;
        }

        let peer = getOrCreateVideoPeer(client_id);
    });
}

async function processMessage(evt) {
    let message = JSON.parse(evt.data);

    console.log('Processing message:', message);

    if (message.type === 'offer') {
        let sessionDesc = {'type': 'offer', 'sdp': message.data};
        let offer = new RTCSessionDescription(sessionDesc);
        let peer = getOrCreateVideoPeer(message.sender, offer);
    } else if (message.type == 'ping') {
        const data = {"receiver": message.sender,
                      "type": "pong",
                      "data": message.data};
        await groundControl.sendMessage(data);

    } else if (message.type == 'bye') {
        let client_id = message.sender;
        if (videoPeers.has(client_id)) {
            await videoPeers.get(client_id).shutdown()
            videoPeers.delete(client_id)
        }
    }
}

async function shutdownVideoPeers() {
    videoPeers.forEach(async function(peer, peer_id) {
        await peer.shutdown();
    });

    videoPeers.clear();
}

async function shutdown() {
    await shutdownVideoPeers();
    await groundControl.shutdown();
}

async function start() {
    const groundControlPromise = establishGroundControl();

    const constraints = {
        audio: true,
        video: true
    }
    const streamPromise = navigator.mediaDevices.getUserMedia(constraints);

    groundControl = await groundControlPromise;
    groundControl.datachannel.addEventListener('message', processMessage);

    localstream = await streamPromise;
    attachVideoElement('video-local', localstream);

    // Wait for data channel to open
    while (groundControl.datachannel.readyState != 'open') {
        await new Promise(r => setTimeout(r, 100));
    }
    let peers = await findPeers();
}

window.addEventListener('beforeunload', async function(event) {
    await shutdown();
});

start()

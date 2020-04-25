'use strict';

var groundControl = null;
var groundControlChannel = null;
var videoPeers = new Map();
var localstream = null;

class VideoPeer {
    constructor(client_id) {
        this.client_id = client_id;
        this.peerconnection = null;
    }

    async createPeerConnection() {
        let config = {
            sdpSemantics: 'unified-plan'
        };
        config.iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
        let pc = new RTCPeerConnection(config);

        pc.addEventListener('icegatheringstatechange', function() {
            console.log("Ice gathering state:", pc.iceGatheringState);
        });

        pc.addEventListener('iceconnectionstatechange', function() {
            console.log("Ice connection state:", pc.iceConnectionState);
        });

        pc.addEventListener('signalingstatechange', function() {
            console.log("Signaling state:", pc.signalingState);
        });

        pc.addEventListener('track', function(evt) {
            if (evt.track.kind == 'video') {
                console.log('Video track received:', evt.track.id)
                document.getElementById('remoteVideo').srcObject = evt.streams[0];

            }
            else {
                console.log('Audio track received:', evt.track.id)
                document.getElementById('remoteAudio').srcObject = evt.streams[0];
            }
        });

        pc.createDataChannel('data');

        console.log('Video peer connection created for peer:', this.client_id);
        this.peerconnection = pc;
    }

    async respondToOffer(offer) {
        await this.peerconnection.setRemoteDescription(offer);
        let answer = await this.peerconnection.createAnswer();
        await this.peerconnection.setLocalDescription(answer);

        const data = {"receiver": this.client_id,
                      "type": "answer",
                      "data": this.peerconnection.localDescription.sdp};
        await sendMessage(data);

        console.log('Answer sent to video peer:', data);
    }

    async negotiateConnection(peeroffer=null) {
        if (peeroffer !== null) {
            return this.respondToOffer(peeroffer);
        }

        console.log('Creating offer to video peer')
        const offer = await this.peerconnection.createOffer();
        await this.peerconnection.setLocalDescription(offer);

        // Wait for ice gathering to complete
        while (this.peerconnection.iceGatheringState != 'complete') {
            await new Promise(r => setTimeout(r, 2000));
            console.log('Ice gathering:', this.peerconnection.iceGatheringState);
        }

        // Make an offer and wait for the answer
        const data = {"receiver": this.client_id,
                      "type": "offer",
                      "data": this.peerconnection.localDescription.sdp};
        let responseParams = {"sender": this.client_id,
                              "type": "answer"};
        console.log('Sending offer to video peer')
        let response = await sendReceiveMessage(data, responseParams);
        let answer = {'type': 'answer', 'sdp': response.data};
        return await this.peerconnection.setRemoteDescription(answer);

        console.log('Answer received from video peer:', response);
    }

    addTrack(track, stream) {
        console.log('Add track:', track);
        this.peerconnection.addTrack(track, stream);
    }

    async shutdown() {
        if (this.peerconnection !== null) {
            this.peerconnection.getReceivers().forEach(receiver => {
                receiver.track.stop();
            });

            this.peerconnection.close();
            this.peerconnection = null;
        }

        const time = new Date().getTime();
        const data = {"receiver": this.client_id,
                      "type": "bye",
                      "data": time};
        await sendMessage(data);

        console.log('Shutdown connection with peer ' + this.client_id);
    }
}

async function sendMessage(data) {
    groundControlChannel.send(JSON.stringify(data));
    console.log('Sent message to Ground Control:', data);
}

async function sendReceiveMessage(data, responseParams) {
    return new Promise((resolve, reject) => {
        function matchResponse(message) {
            for (const key in responseParams) {
                //console.log('Matching key: ' + key + ' -> ' + responseParams[key]);
                //console.log('\tMessage has key? ' + message.hasOwnProperty(key));
                //if (message.hasOwnProperty(key)) {
                //    console.log('\tIn message: ' + key + ' -> ' + message[key]);
                //    console.log('\tIn params:  ' + key + ' -> ' + responseParams[key]);
                //}
                if (!(message.hasOwnProperty(key) && message[key] === responseParams[key])) {
                    return false;
                }
            }
            return true;
        }

        function onMessage(evt) {
            let message = JSON.parse(evt.data);
            if (matchResponse(message)) {
                console.log('Received valid response message:', message);
                groundControlChannel.removeEventListener('message', onMessage);
                resolve(message);
            }
        }

        groundControlChannel.addEventListener('message', onMessage);
        groundControlChannel.send(JSON.stringify(data));
        console.log('Sent message to Ground Control:', data);
    });
}

async function ping() {
    if (groundControlChannel == null) {
        console.log('Cannot send ping -- data channel isn\'t established!');
        return;
    }

    const time = new Date().getTime();
    const data = {"receiver": "ground control",
                  "type": "ping",
                  "data": time};
    console.log('ping: ', data);
    groundControlChannel.send(JSON.stringify(data));
}

async function get_self_id() {
    if (groundControlChannel == null) {
        console.log('Cannot get room info -- data channel isn\'t established!');
        return;
    }

    const time = new Date().getTime();
    let data = {"receiver": "ground control",
                "type": "ping",
                "data": time};
    let responseParams = {"sender": "ground control",
                          "type": "pong",
                          "data": time};
    let response = await sendReceiveMessage(data, responseParams);
    return response.receiver;

}

async function get_room_info() {
    if (groundControlChannel == null) {
        console.log('Cannot get room info -- data channel isn\'t established!');
        return;
    }

    let data = {"receiver": "ground control",
                "type": "get-room-info"};
    let responseParams = {"sender": "ground control",
                          "type": "get-room-info"};
    let response = await sendReceiveMessage(data, responseParams);
    return response.data;
}

async function greeting() {
    if (groundControlChannel == null) {
        console.log('Cannot send greeting -- data channel isn\'t established!');
        return;
    }

    const data = {"receiver": "ground control",
                  "type": "greeting",
                  "data": "This is Major Tom to Ground Control: I'm stepping through the door. And the stars look very different today."};
    console.log('greeting:', data);
    groundControlChannel.send(JSON.stringify(data));
}

function createGroundControlConnection() {
    var config = {
        sdpSemantics: 'unified-plan'
    };
    config.iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
    var pc = new RTCPeerConnection(config);

    pc.addEventListener('icegatheringstatechange', function() {
        console.log("Ice gathering state:", pc.iceGatheringState);
    });

    pc.addEventListener('iceconnectionstatechange', function() {
        console.log("Ice connection state:", pc.iceConnectionState);
    });

    pc.addEventListener('signalingstatechange', function() {
        console.log("Signaling state:", pc.signalingState);
    });

    pc.addEventListener('track', function(evt) {
        if (evt.track.kind == 'video') {
            console.log('Video track received:', evt.track.id)
            document.getElementById('localVideo').srcObject = evt.streams[0];
        }
        else {
            console.log('Audio track received:', evt.track.id)
            document.getElementById('localAudio').srcObject = evt.streams[0];
        }
    });

    groundControlChannel = pc.createDataChannel('data');
    groundControlChannel.onopen = function(evt) {
        greeting()
    };
    groundControlChannel.onmessage = function(evt) {
        console.log('Received message:', evt.data);
    };


    console.log('Connection for Ground Control created');

    return pc;
}


async function postJson(url, body) {
    request = {
        body: JSON.stringify(body),
        headers: {'Content-Type': 'application/json'},
        method: 'POST'
    }
    return fetch(request)
}

async function offerGroundControl(pc) {
    console.log('Creating offer to Ground Control')
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for ice gathering to complete
    while (pc.iceGatheringState != 'complete') {
        await new Promise(r => setTimeout(r, 100));
    }

    // Make an offer and wait for the answer
    const response = await fetch(document.URL + '/offer', {
        body: JSON.stringify({sdp: pc.localDescription.sdp, type: pc.localDescription.type}),
        headers: {'Content-Type': 'application/json'},
        method: 'POST'
    });
    const answer = await response.json();
    await pc.setRemoteDescription(answer);

    console.log('Answer received from Ground Control', pc);
}

async function establishGroundControl() {
    const groundControl = createGroundControlConnection();
    offerGroundControl(groundControl);
    return groundControl;
}

async function createVideoPeer(client_id, offer=null) {
    let peer = new VideoPeer(client_id);
    videoPeers.set(client_id, peer);

    await peer.createPeerConnection();

    for (const track of localstream.getTracks()) {
        peer.addTrack(track, localstream);
    }

    await peer.negotiateConnection(offer);
}

async function getOrCreateVideoPeer(client_id, offer=null) {
    if (!videoPeers.has(client_id)) {
        return createVideoPeer(client_id, offer);
    }

    return videoPeers.get(client_id);
}

async function findPeers() {
    let self_id = await get_self_id();
    console.log('Got self_id:', self_id);
    let room_info = await get_room_info();
    console.log('Got room info:', room_info);
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
        console.log('Shutdown connection with peer ' + peer_id);
        await peer.shutdown();
    });
}

async function shutdownGroundControl() {
    if (groundControl !== null) {
        groundControl.getReceivers().forEach(receiver => {
            receiver.track.stop();
        });
    }

    const time = new Date().getTime();
    const data = {"receiver": "ground control",
                  "type": "bye",
                  "data": time};
    await sendMessage(data);

    groundControl.close();
    groundControl = null;

    console.log('Shutdown connection with Ground Control ');
}

async function shutdown() {
    await shutdownVideoPeers();
    await shutdownGroundControl();
}

async function start() {
    const groundControlPromise = establishGroundControl();

    const constraints = {
        audio: true,
        video: true
    }
    const streamPromise = navigator.mediaDevices.getUserMedia(constraints);

    groundControl = await groundControlPromise;
    localstream = await streamPromise;

    groundControlChannel.addEventListener('message', processMessage);

    const videoElement = document.querySelector('video#localVideo');
    videoElement.srcObject = localstream;

    // Wait for data channel to open
    while (groundControlChannel.readyState != 'open') {
        await new Promise(r => setTimeout(r, 100));
    }
    let peers = await findPeers();
}

window.addEventListener('beforeunload', async function(event) {
    await shutdown();
});

start()

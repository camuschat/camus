'use strict';

var groundControl = null;
var groundControlChannel = null;
var pcs = {}

class VideoPeer {
    constructor() {
        this.peerconnection = null;
    }
}

class MessagePromise {
    constructor(responseParams) {
        this.responseParams = responseParams;
    }
}

async function send(data, responseParams) {
    promise = MessagePromise(responseParams);
    groundControlChannel.send(JSON.stringify(data));
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

async function get_room_info() {
    if (groundControlChannel == null) {
        console.log('Cannot get room info -- data channel isn\'t established!');
        return;
    }

    const data = {"receiver": "ground control",
                  "type": "get-room-info"}
    console.log('get-room-info: ', data);
    groundControlChannel.send(JSON.stringify(data));
    
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

async function createVideoPeerConnection() {
    var config = {
        sdpSemantics: 'unified-plan'
    };
    config.iceServers = [{urls: ['stun:stun.l.google.com:19302']}];
    var pc = new RTCPeerConnection(config);

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

    console.log('Video peer connection created');

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

async function _offerGroundControl(pc) {
    console.log('Creating offer to Ground Control')
    await pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))

    // Wait for ice gathering to complete
    while (pc.iceGatheringState != 'complete') {
        await new Promise(r => setTimeout(r, 100));
    }

    // Make an offer and wait for the answer
    request = {
        body: JSON.stringify({sdp: pc.localDescription.sdp, type: pc.localDescription.type}),
        headers: {'Content-Type': 'application/json'},
        method: 'POST'
    }
    fetch(document.URL, request) // postJson(document.URL, body)
        .then(response => response.json())
        .then(answer => pc.setRemoteDescription(answer));
    console.log('Answer received from Ground Control', pc);
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
    const response = await fetch(document.URL, {
        body: JSON.stringify({sdp: pc.localDescription.sdp, type: pc.localDescription.type}),
        headers: {'Content-Type': 'application/json'},
        method: 'POST'
    });
    const answer = await response.json();
    await pc.setRemoteDescription(answer);

    console.log('Answer received from Ground Control', pc);
}

async function offerVideoPeer(peer_id, pc) {
    console.log('Creating offer to video peer')
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait for ice gathering to complete
    while (pc.iceGatheringState != 'complete') {
        await new Promise(r => setTimeout(r, 200));
    }

    // Make an offer and wait for the answer
    const data = {"receiver": peer_id,
                  "type": "offer",
                  "data": pc.localDescription.sdp};
    groundControlChannel.send(JSON.stringify(data));

    console.log('Answer received from video peer', pc);
}

async function establishGroundControl() {
    const groundControl = createGroundControlConnection();
    offerGroundControl(groundControl);
    return groundControl;
}

async function establishVideoPeer(peer_id) {
    const pc = createVideoPeerConnection();
    offerVideoPeer(peer_id, pc);
    return pc;
}

async function findPeers() {
    room_info = get_room_info();
    for (client_id in room_info) {
        peer = new VideoPeer();
    }
}

async function start() {
    const groundControlPromise = establishGroundControl();

    const constraints = {
        audio: true,
        video: true
    }
    const streamPromise = navigator.mediaDevices.getUserMedia(constraints);

    groundControl = await groundControlPromise;
    let stream = await streamPromise;

    //navigator.mediaDevices.getUserMedia(constraints)
    //    .then(stream => do_thing(stream))
    //    .then(result => do_other_thing(result))
    //    .catch(error => console.log('Error:', error));

    //async function do_thing(stream) {
    //    console.log('A thing is done with stream', stream);
    //}

    //for (const track of stream.getTracks()) {
    //    console.log('Adding track:', track);
    //    groundControl.addTrack(track, stream);
    //}


    const videoElement = document.querySelector('video#localVideo');
    //videoElement.srcObject = stream;

    //peers = await findPeers();
}

start()

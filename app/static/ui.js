'use strict';

var videoMode = 'camera';

function attachVideoElement(id, stream) {
    let videoElement = document.getElementById('video-' + id);
    videoElement.srcObject = stream;
}

function videoBoxOnClick(evt) {
    // Move video element in and out of center stage on click
    let stage = document.getElementById('video-stage');
    let thumbs = document.getElementById('video-thumbs');

    let stageVideo = stage.firstElementChild;
    if (stageVideo != null) {
        thumbs.append(stageVideo);
    }

    if (videoBox !== stageVideo) {
        stage.append(videoBox);
    }
}

function createVideoElement(id) {
    if (document.querySelector('#video-box-' + id)) {
        // element already exists
        return;
    }

    let videoTag = document.createElement('p');
    videoTag.className = 'video-tag'
    videoTag.innerHTML = id;

    let videoElement = document.createElement('video');
    videoElement.id = 'video-' + id;
    videoElement.autoplay = 'true';
    videoElement.style.width = '100%';
    videoElement.playsinline = 'true';
    //videoElement.draggable = 'true';
    if (id === 'local') {videoElement.muted = 'true';}
    let videoThumbs = document.getElementById('video-thumbs');

    let videoBox = document.createElement('div');
    videoBox.className = 'video-box';
    videoBox.id = 'video-box-' + id;
    videoBox.draggable = 'true';
    videoBox.ondragstart = (evt) => {
        dragVideo(evt);
    };
    videoBox.ondrop = (evt) => {
        dropVideo(evt, videoBox.id);
    };
    videoBox.ondragover = (evt) => {
        allowVideoDrop(evt);
    }

    videoBox.addEventListener('click', function(evt) {
        console.log('Click on videoBox', videoBox);
        // Move video box in and out of center stage on click
        let stage = document.getElementById('video-stage');
        let thumbs = document.getElementById('video-thumbs');

        let stageVideo = stage.firstElementChild;
        if (stageVideo != null) {
            thumbs.append(stageVideo);
        }

        if (videoBox !== stageVideo) {
            stage.append(videoBox);
        }
    });

    videoBox.appendChild(videoTag);
    videoBox.appendChild(videoElement);
    videoThumbs.appendChild(videoBox);
}

function dragVideo(evt) {
    console.log('dragVideo');
    evt.dataTransfer.setData('id', evt.target.id);
}

function allowVideoDrop(evt) {
    evt.preventDefault();
}

function dropVideo(evt, myId) {
    console.log('dropVideo');
    evt.preventDefault();

    let otherId = evt.dataTransfer.getData('id');
    let me = document.getElementById(myId);
    let other = document.getElementById(otherId);
    swapNodes(me, other);

    console.log('Drop ' + other.id + ' on me!!!');
}

function swapNodes(node1, node2) {
    let parent1 = node1.parentNode;
    let parent2 = node2.parentNode;

    let temp1 = document.createElement('span');
    let temp2 = document.createElement('span');

    parent1.insertBefore(temp1, node1);
    parent2.insertBefore(temp2, node2);
    parent1.insertBefore(node2, temp1);
    parent2.insertBefore(node1, temp2);

    parent1.removeChild(temp1);
    parent2.removeChild(temp2);
}

function toggleVideo() {
    if (videoMode == 'camera') {
        // Stop the current video track
        let currentVideoTrack = manager.localVideoStream.getTracks().find(track => track.kind === 'video');
        currentVideoTrack.stop();

        // Update ui
        document.getElementById('toggle-video-icon').innerHTML = 'videocam_off';
        videoMode = 'off';
    } else {
        streamVideo();
    }
}

async function toggleDisplay() {
    if (videoMode == 'display') {
        // Stop the current video track
        let currentVideoTrack = manager.localVideoStream.getTracks().find(track => track.kind === 'video');
        currentVideoTrack.stop();

        // Update ui
        document.getElementById('toggle-display-icon').innerHTML = 'stop_screen_share';
        videoMode = 'off';
    } else {
        streamDisplay();
    }
}

function toggleAudio() {
    console.log('Toggle audio', manager.audioTrack);
    manager.toggleAudio();

    let icon = document.getElementById('toggle-audio-icon');
    if (manager.audioEnabled()) {
        icon.innerHTML = 'mic';
    } else {
        icon.innerHTML = 'mic_off';
    }
}

async function streamVideo() {
    // Get stream from cam and mic
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
    let stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Stop the current video track
    let currentVideoTrack = manager.localVideoStream.getTracks().find(track => track.kind === 'video');
    currentVideoTrack.stop();

    // Update everything with new video track
    let newTrack = stream.getTracks().find(track => track.kind === 'video');
    document.getElementById('video-local').srcObject = stream;
    manager.localVideoStream = stream;
    manager.setVideoTrack(newTrack);

    // Update ui
    document.getElementById('toggle-video-icon').innerHTML = 'videocam';
    document.getElementById('toggle-display-icon').innerHTML = 'stop_screen_share';
    videoMode = 'camera';
}

async function streamDisplay() {
    // Get display stream
    const constraints = {
        'video': {
            cursor: 'always',
            displaySurface: 'application'
        },
        'audio': false
    }
    let stream = await navigator.mediaDevices.getDisplayMedia(constraints);

    // Stop the current video track
    let currentVideoTrack = manager.localVideoStream.getTracks().find(track => track.kind === 'video');
    currentVideoTrack.stop();

    // Update everything with new video track
    let newTrack = stream.getTracks().find(track => track.kind === 'video');
    document.getElementById('video-local').srcObject = stream;
    manager.localVideoStream = stream;
    manager.setVideoTrack(newTrack);

    // Update ui
    document.getElementById('toggle-video-icon').innerHTML = 'videocam_off';
    document.getElementById('toggle-display-icon').innerHTML = 'screen_share';
    videoMode = 'display';
}

async function sendMessage() {
    let messageLog = document.getElementById('message-log');
    let messageInput = document.getElementById('message-input');
    let message = messageInput.value;

    const time = new Date().getTime();
    const data = {receiver: 'room',
                  type: 'text',
                  data: {from: manager.username,
                         time: time,
                         text: message}
                 };
    await manager.groundControl.sendMessage(data);
    messageInput.value = '';
    console.log('Sent message: ', message);
};

function updateMessageBar(message) {
    let time = document.createElement('p');
    time.setAttribute('class', 'message-time');
    time.innerHTML = new Date(message.data.time).toLocaleTimeString("en-US");

    let from = document.createElement('p');
    from.setAttribute('class', 'message-from');
    from.innerHTML = message.data.from;

    let text = document.createElement('p');
    text.setAttribute('class', 'message-text');
    text.innerHTML = message.data.text;

    let messageLog = document.getElementById('message-log');
    messageLog.appendChild(from);
    messageLog.appendChild(time);
    messageLog.appendChild(text);
}

function promptUserName() {
    $('#user-profile-modal').modal();
}

async function saveUserProfile() {
    let username = document.getElementById('username-input').value;
    await manager.setUsername(username);
    console.log('Set username: ', username);
}

function shutdown() {
    manager.shutdown();
}

function mediaInfo() {
    let videoSettings = manager.videoTrack.getSettings();
    console.log('Device ID: ', videoSettings.deviceId);
    console.log('Framerate: ', videoSettings.frameRate);
    console.log('Height: ', videoSettings.height);
    console.log('Width: ', videoSettings.width);
};

function updateTechnical() {
    console.log('In updateTechnical()');
    let technicalBar = document.querySelector('#technical-bar');
    technicalBar.textContent = '';
    // ground control
    //manager.groundControl.connectionState();

    manager.videoPeers.forEach((peer, peer_id) => {
        console.log('Update technical for client ' + peer_id);
        let info = connectionInfoNode(peer);
        console.log('Info node: ');
        console.log(info);
        technicalBar.appendChild(info);
    });
}

function connectionInfoNode(peer) {
    let template = document.querySelector('#connection-info-template');
    let clone = template.content.cloneNode(true);

    let div = clone.querySelector('div');
    div.id = 'connection-info-' + peer.client_id;

    let button = clone.querySelector('button');
    button.dataset.target = '#connection-info-collapse-' + peer.client_id;
    button.innerHTML = peer.username;

    let infoDiv = clone.querySelector('div.collapse');
    infoDiv.id = 'connection-info-collapse-' + peer.client_id;
    infoDiv.querySelector('.info-username').innerHTML = peer.username;
    infoDiv.querySelector('.info-client-id').innerHTML = peer.client_id;
    infoDiv.querySelector('.info-connection-state').innerHTML = peer.connectionState();
    infoDiv.querySelector('.info-ice-connection-state').innerHTML = peer.iceConnectionState();
    infoDiv.querySelector('.info-signaling-state').innerHTML = peer.signalingState();
    //infoDiv.querySelector('.info-remote-description').innerHTML = peer.remoteDescription();

    return clone;
}

async function startUI() {
    console.log('base uri: ', document.baseURI);
    console.log('uri: ', document.documentURI);
    console.log('domain: ', document.domain);
    console.log('cookie: ', document.cookie);
    console.log('error checking: ', document.strictErrorChecking);
    console.log('referrer: ', document.referrer);
    console.log('last modified: ', document.lastModified);
    console.log('scripts: ', document.scripts);

    await new Promise(r => setTimeout(r, 200)); // allow manager to start up
    let messageParams = {"type": "text"};
    manager.addMessageListener(messageParams, updateMessageBar);

    document.querySelector('#technical-button').addEventListener('click', () => {
        updateTechnical();
    });

    promptUserName();
}

//startUI();

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

function toggleMessageBar() {
    console.log('Toggle messages');

    let videoThumbs = document.getElementById('video-thumbs');
    let messageBar = document.getElementById('message-bar');

    if (messageBar.style.display === 'none') {
        videoThumbs.style.display = 'none';
        messageBar.style.display = 'block';
    } else {
        videoThumbs.style.display = 'block';
        messageBar.style.display = 'none';
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

function sendMessage() {
    let messageLog = document.getElementById('message-log');
    let message = document.getElementById('message-input').value;
    console.log('Send message: ' + message);
    messageLog.innerHTML += '<p>' + message + '<p>';
};

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

function startUI() {
    console.log('base uri: ', document.baseURI);
    console.log('uri: ', document.documentURI);
    console.log('domain: ', document.domain);
    console.log('cookie: ', document.cookie);
    console.log('error checking: ', document.strictErrorChecking);
    console.log('referrer: ', document.referrer);
    console.log('last modified: ', document.lastModified);
    console.log('scripts: ', document.scripts);

    document.getElementById('message-input').addEventListener('change', () => {
        console.log('onchange: ', document.getElementById('message-input').value);
    });
}

startUI();

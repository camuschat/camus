'use strict';

var videoMode = 'camera';
var audioTrack = null;

function attachVideoElement(id, stream) {
    let videoelement = document.getElementById(id);
    videoelement.srcObject = stream;

    videoelement.addEventListener("click", function(evt) {
        // Move video element in and out of center stage on click
        let stage = document.getElementById('video-stage');
        let thumbs = document.getElementById('video-thumbs');

        let stageVideo = stage.firstElementChild;
        if (stageVideo != null) {
            thumbs.append(stageVideo);
        }

        if (videoelement !== stageVideo) {
            stage.append(videoelement);
        }
    });
}

function createVideoElement(id) {
    let videoelement = document.createElement('video');
    videoelement.id = id;
    videoelement.autoplay = 'true';
    videoelement.style.width = '100%';
    videoelement.playsinline = 'true';
    let videoThumbs = document.getElementById('video-thumbs');
    videoThumbs.appendChild(videoelement);
}

function toggleVideo() {
    if (videoMode == 'camera') {
        // Stop the current video track
        let currentVideoTrack = localVideoStream.getTracks().find(track => track.kind === 'video');
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
        let currentVideoTrack = localVideoStream.getTracks().find(track => track.kind === 'video');
        currentVideoTrack.stop();

        // Update ui
        document.getElementById('toggle-display-icon').innerHTML = 'stop_screen_share';
        videoMode = 'off';
    } else {
        streamDisplay();
    }
}

function toggleAudio() {
    console.log('Toggle audio', audioTrack);
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log(audioTrack.kind + ' enabled: ' + audioTrack.enabled);

        let icon = document.getElementById('toggle-audio-icon');
        if ( audioTrack.enabled) {
            icon.innerHTML = 'mic';
        } else {
            icon.innerHTML = 'mic_off';
        }
    }
}

async function streamVideo() {
    // Get stream from cam and mic
    const constraints = {
        audio: true,
        video: true
    }
    let stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Stop the current video track
    let currentVideoTrack = localVideoStream.getTracks().find(track => track.kind === 'video');
    currentVideoTrack.stop();

    // Update everything with new video track
    let newTrack = stream.getTracks().find(track => track.kind === 'video');
    document.getElementById('video-local').srcObject = stream;
    localVideoStream = stream;
    setVideoTrack(newTrack);

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
    let currentVideoTrack = localVideoStream.getTracks().find(track => track.kind === 'video');
    currentVideoTrack.stop();

    // Update everything with new video track
    let newTrack = stream.getTracks().find(track => track.kind === 'video');
    document.getElementById('video-local').srcObject = stream;
    localVideoStream = stream;
    setVideoTrack(newTrack);

    // Update ui
    document.getElementById('toggle-video-icon').innerHTML = 'videocam_off';
    document.getElementById('toggle-display-icon').innerHTML = 'screen_share';
    videoMode = 'display';
}

function setVideoTrack(track) {
    videoPeers.forEach((peer, peer_id) => {
        console.log('Replace video track for peer ' + peer_id);
        peer.setTrack(track);
    });
}

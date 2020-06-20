'use strict';

import {Manager} from './rtcclient.js';

class UI {
    constructor(manager) {
        this.manager = manager;
        this.videoMode = 'camera';
    }

    attachVideoElement(id, stream) {
        let videoElement = document.getElementById('video-' + id);
        videoElement.srcObject = stream;
    }

    createVideoElement(id, username) {
        if (document.querySelector('#video-box-' + id)) {
            // element already exists
            return;
        }

        let videoTag = document.createElement('p');
        videoTag.className = 'video-tag';
        videoTag.innerHTML = username;

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
        };

        videoBox.addEventListener('click', (evt) => {
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

        videoElement.addEventListener('mouseover', (evt) => {
            if (id === 'local') {
                videoTag.innerHTML = this.manager.username;
                return;
            }

            const videoPeer = this.manager.videoPeers.get(id);
            videoTag.innerHTML = videoPeer.username;
        });

        videoBox.appendChild(videoTag);
        videoBox.appendChild(videoElement);
        videoThumbs.appendChild(videoBox);
    }

    removeVideoElement(id) {
        const videoelement = document.getElementById('video-box-' + id);
        if (videoelement) {
            videoelement.remove();
        }
    }

    async toggleVideo() {
        if (this.videoMode == 'camera') {
            // Stop the current video track
            let currentVideoTrack = this.manager.localVideoStream.getTracks().find(track => track.kind === 'video');
            currentVideoTrack.stop();

            // Update ui
            document.getElementById('toggle-video-icon').innerHTML = 'videocam_off';
            this.videoMode = 'off';
        } else {
            await this.streamVideo();
        }
    }

    async toggleDisplay() {
        if (this.videoMode == 'display') {
            // Stop the current video track
            let currentVideoTrack = this.manager.localVideoStream.getTracks().find(track => track.kind === 'video');
            currentVideoTrack.stop();

            // Update ui
            document.getElementById('toggle-display-icon').innerHTML = 'stop_screen_share';
            this.videoMode = 'off';
        } else {
            await this.streamDisplay();
        }
    }

    toggleAudio() {
        console.log('Toggle audio', this.manager.audioTrack);
        this.manager.toggleAudio();

        let icon = document.getElementById('toggle-audio-icon');
        if (this.manager.audioEnabled()) {
            icon.innerHTML = 'mic';
        } else {
            icon.innerHTML = 'mic_off';
        }
    }

    async streamVideo() {
        // Stop the current video track
        if (this.manager.localVideoStream) {
            const currentVideoTrack = this.manager.localVideoStream.getTracks().find(track => track.kind === 'video');
            if (currentVideoTrack) {
                currentVideoTrack.stop();
            }
        }

        // Get stream from cam and mic
        const constraints = {
            audio: true,
            video: true
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        // Update everything with new video track
        const videoTrack = stream.getTracks().find(track => track.kind === 'video');
        const audioTrack = stream.getTracks().find(track => track.kind === 'audio');
        this.createVideoElement('local', this.manager.username);
        this.attachVideoElement('local', stream);
        this.manager.localVideoStream = stream;
        this.manager.setVideoTrack(videoTrack);
        this.manager.setAudioTrack(audioTrack);

        // Update ui
        document.getElementById('toggle-video-icon').innerHTML = 'videocam';
        document.getElementById('toggle-display-icon').innerHTML = 'stop_screen_share';
        this.videoMode = 'camera';
    }

    async streamDisplay() {
        // Get display stream
        const constraints = {
            'video': {
                cursor: 'always',
                displaySurface: 'application'
            },
            'audio': false
        };
        let stream = await navigator.mediaDevices.getDisplayMedia(constraints);

        // Stop the current video track
        let currentVideoTrack = this.manager.localVideoStream.getTracks().find(track => track.kind === 'video');
        currentVideoTrack.stop();

        // Update everything with new video track
        let newTrack = stream.getTracks().find(track => track.kind === 'video');
        document.getElementById('video-local').srcObject = stream;
        this.manager.localVideoStream = stream;
        this.manager.setVideoTrack(newTrack);

        // Update ui
        document.getElementById('toggle-video-icon').innerHTML = 'videocam_off';
        document.getElementById('toggle-display-icon').innerHTML = 'screen_share';
        this.videoMode = 'display';
    }

    async sendMessage() {
        let messageLog = document.getElementById('message-log');
        let messageInput = document.getElementById('message-input');
        let message = messageInput.value;

        if (!message) {
            return;
        }

        const time = new Date().getTime();
        const data = {receiver: 'room',
                      type: 'text',
                      data: {from: this.manager.username,
                             time: time,
                             text: message}
                    };
        await this.manager.groundControl.sendMessage(data);
        messageInput.value = '';
        console.log('Sent message: ', message);
    }

    updateMessageBar(message) {
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

    promptUserName() {
        $('#user-profile-modal').modal('show');
    }

    async saveUserProfile() {
        const username = document.querySelector('#username-input').value;
        await this.manager.setUsername(username);

        $('#user-profile-modal').modal('hide');
    }

    restartIce() {
        this.manager.videoPeers.forEach((peer, peer_id) => {
            peer.restartIce();
        });
    }

    mediaInfo() {
        let videoSettings = this.manager.videoTrack.getSettings();
        console.log('Device ID: ', videoSettings.deviceId);
        console.log('Framerate: ', videoSettings.frameRate);
        console.log('Height: ', videoSettings.height);
        console.log('Width: ', videoSettings.width);
    }

    updateTechnical() {
        let technicalBar = document.querySelector('#technical-bar');
        technicalBar.textContent = '';

        this.manager.videoPeers.forEach((peer, peer_id) => {
            console.log('Update technical for client ' + peer_id);
            let info = connectionInfoNode(peer);
            technicalBar.appendChild(info);
        });
    }

    async start() {

        await new Promise(r => setTimeout(r, 200)); // allow manager to start up
        await this.streamVideo();
        let messageParams = {"type": "text"};
        this.manager.addMessageListener(messageParams, this.updateMessageBar);

        this.manager.on('videopeer', (peer) => {
            // Display video when a track is received from a peer
            peer.on('track', (track, streams) => {
                if (track.kind === 'video') {
                    track.onunmute = () => {
                        this.createVideoElement(peer.client_id, peer.username);
                        this.attachVideoElement(peer.client_id, streams[0]);
                    };
                }
            });

            // Remove video when a peer disconnects
            peer.on('shutdown', () => {
                this.removeVideoElement(peer.client_id);
            });
            peer.on('connectionstatechange', (connectionState) => {
                switch(connectionState) {
                    case 'disconnected':
                    case 'failed':
                    case 'closed':
                        this.removeVideoElement(peer.client_id);
                        break;
                }
            });
        });

        // Set up button listeners
        document.querySelector('#toggle-video').addEventListener('click', () => {
            this.toggleVideo();
        });
        document.querySelector('#toggle-audio').addEventListener('click', () => {
            this.toggleAudio();
        });
        document.querySelector('#toggle-display').addEventListener('click', () => {
            this.toggleDisplay();
        });
        document.querySelector('#technical-button').addEventListener('click', () => {
            this.updateTechnical();
        });

        this.promptUserName();
    }

    shutdown() {
        this.manager.shutdown();
    }
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
    infoDiv.querySelector('.info-ice-gathering-state').innerHTML = peer.iceGatheringState();
    infoDiv.querySelector('.info-signaling-state').innerHTML = peer.signalingState();
    //infoDiv.querySelector('.info-remote-description').innerHTML = peer.remoteDescription();

    return clone;
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

export {UI};

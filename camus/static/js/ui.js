'use strict';

class UI {
    constructor(manager) {
        this.manager = manager;
        this.videoMode = 'off';
        this.audioMode = 'off';
    }

    attachVideoElement(id, stream) {
        const videoElement = document.getElementById('video-' + id);
        videoElement.srcObject = stream;
    }

    createVideoElement(id, username) {
        if (document.querySelector('#video-box-' + id)) {
            // element already exists
            return;
        }

        const videoTag = document.createElement('p');
        videoTag.className = 'video-tag';
        videoTag.innerHTML = username;

        const videoElement = document.createElement('video');
        videoElement.id = 'video-' + id;
        videoElement.autoplay = 'true';
        videoElement.playsinline = 'true';
        if (id === 'local') videoElement.muted = 'true';
        const videoThumbs = document.getElementById('video-thumbs');
        const videoStage = document.getElementById('video-stage');

        const videoBox = document.createElement('div');
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

        videoBox.addEventListener('dblclick', () => {
            // Move video box in and out of center stage on double click
            const stage = document.getElementById('video-stage');
            const thumbs = document.getElementById('video-thumbs');

            const stageVideo = stage.firstElementChild;
            if (stageVideo != null) {
                thumbs.append(stageVideo);
            }

            if (videoBox !== stageVideo) {
                stage.append(videoBox);
            }
        });

        videoElement.addEventListener('mouseover', () => {
            if (id === 'local') {
                videoTag.innerHTML = this.manager.username;
                return;
            }

            const videoPeer = this.manager.videoPeers.get(id);
            videoTag.innerHTML = videoPeer.username;
        });

        videoBox.appendChild(videoTag);
        videoBox.appendChild(videoElement);

        if (videoStage.firstElementChild === null) {
            videoStage.appendChild(videoBox);
        } else {
            videoThumbs.appendChild(videoBox);
        }
    }

    removeVideoElement(id) {
        const videoelement = document.getElementById('video-box-' + id);
        if (videoelement) {
            videoelement.remove();
        }
    }

    async toggleVideo() {
        const videoIcon = document.getElementById('toggle-video-icon');
        const displayIcon = document.getElementById('toggle-display-icon');

        if (this.videoMode == 'camera') {
            this.manager.videoEnabled = false;
            videoIcon.innerHTML = 'videocam_off';
            this.videoMode = 'camera-disabled';
        } else if (this.videoMode == 'camera-disabled') {
            this.manager.videoEnabled = true;
            videoIcon.innerHTML = 'videocam';
            this.videoMode = 'camera';
        } else {
            const {video} = await this.streamUserMedia(false, true);
            if (video) {
                videoIcon.innerHTML = 'videocam';
                displayIcon.innerHTML = 'stop_screen_share';
                this.videoMode = 'camera';
            }
        }
    }

    async toggleDisplay() {
        const videoIcon = document.getElementById('toggle-video-icon');
        const displayIcon = document.getElementById('toggle-display-icon');

        if (this.videoMode == 'display') {
            this.manager.stopVideo();
            displayIcon.innerHTML = 'stop_screen_share';
            this.videoMode = 'off';
        } else {
            const video = await this.streamDisplay();
            if (video) {
                videoIcon.innerHTML = 'videocam_off';
                displayIcon.innerHTML = 'screen_share';
                this.videoMode = 'display';
            }
        }
    }

    async toggleAudio() {
        const audioIcon = document.getElementById('toggle-audio-icon');

        if (this.audioMode == 'mic') {
            this.manager.audioEnabled = false;
            audioIcon.innerHTML = 'mic_off';
            this.audioMode = 'mic-disabled';
        } else if (this.audioMode == 'mic-disabled') {
            this.manager.audioEnabled = true;
            audioIcon.innerHTML = 'mic';
            this.audioMode = 'mic';
        } else {
            const {audio} = await this.streamUserMedia(true, false);
            if (audio) {
                audioIcon.innerHTML = 'mic';
                this.audioMode = 'mic';
            }
        }
    }

    async getCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch(err) {
            console.error(err);
            return [];
        }
    }

    async getMics() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'audioinput');
        } catch(err) {
            console.error(err);
            return [];
        }
    }

    async hasCamera() {
        const cameras = await this.getCameras();
        return cameras.length > 0;
    }

    async hasMic() {
        const mics = await this.getMics();
        return mics.length > 0;
    }

    async streamUserMedia(audio=true, video=true) {
        const hasMic = await this.hasMic();
        const hasCamera = await this.hasCamera();
        const constraints = {
            audio: audio && hasMic,
            video: video && hasCamera
        };

        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (!this.manager.localVideoStream) this.manager.localVideoStream = stream;
        } catch(err) {
            console.error(err);
            return {audio: null, video: null};
        }

        const videoTrack = stream.getTracks().find(track => track.kind === 'video');
        const audioTrack = stream.getTracks().find(track => track.kind === 'audio');

        if (audioTrack) {
            this.manager.stopAudio();
            await this.manager.setAudioTrack(audioTrack);
        }

        if (videoTrack) {
            this.manager.stopVideo();
            await this.manager.setVideoTrack(videoTrack);
            this.createVideoElement('local', this.manager.username);
            this.attachVideoElement('local', stream);
        }

        return {audio: audioTrack, video: videoTrack}
    }

    async streamDisplay() {
        const constraints = {
            'video': {cursor: 'always'},
            'audio': false
        };

        let stream;
        try {
            stream = await navigator.mediaDevices.getDisplayMedia(constraints);
            if (!this.manager.localVideoStream) this.manager.localVideoStream = stream;
        } catch(err) {
            console.error(err);
            return null;
        }

        const videoTrack = stream.getTracks().find(track => track.kind === 'video');
        if (videoTrack) {
            this.manager.stopVideo();
            await this.manager.setVideoTrack(videoTrack);
            this.createVideoElement('local', this.manager.username);
            this.attachVideoElement('local', stream);
        }

        return videoTrack;
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value;

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
        await this.manager.signaler.send(data);
        messageInput.value = '';
    }

    updateMessageBar(message) {
        const time = document.createElement('p');
        time.setAttribute('class', 'message-time');
        time.innerHTML = new Date(message.data.time).toLocaleTimeString("en-US");

        const from = document.createElement('p');
        from.setAttribute('class', 'message-from');
        from.innerHTML = message.data.from;

        const text = document.createElement('p');
        text.setAttribute('class', 'message-text');
        text.innerHTML = message.data.text;

        const messageLog = document.getElementById('message-log');
        messageLog.appendChild(from);
        messageLog.appendChild(time);
        messageLog.appendChild(text);
    }

    promptUserName() {
        $('#user-profile-modal').modal('show');
    }

    saveUserProfile() {
        const username = document.querySelector('#username-input').value;
        this.manager.setUsername(username);

        $('#user-profile-modal').modal('hide');
    }

    updateTechnical() {
        const technicalBar = document.querySelector('#technical-bar');
        technicalBar.textContent = '';

        this.manager.videoPeers.forEach((peer) => {
            const info = connectionInfoNode(peer);
            technicalBar.appendChild(info);
        });
    }

    async startUserMedia() {
        const {audio, video} = await this.streamUserMedia(true, true);
        const videoIcon = document.getElementById('toggle-video-icon');
        const displayIcon = document.getElementById('toggle-display-icon');
        const audioIcon = document.getElementById('toggle-audio-icon');

        if (video) {
            videoIcon.innerHTML = 'videocam';
            displayIcon.innerHTML = 'stop_screen_share';
            this.videoMode = 'camera';
        }

        if (audio) {
            audioIcon.innerHTML = 'mic';
            this.audioMode = 'mic';
        }
    }

    async start() {
        // Listner for user profile dialog
        const profileForm = document.querySelector('#user-profile-modal form');
        profileForm.addEventListener('submit', (evt) => {
            evt.preventDefault();
            this.saveUserProfile();
        });

        // Listener for sending text messages
        const messageForm = document.querySelector('#message-bar form');
        messageForm.addEventListener('submit', (evt) => {
            evt.preventDefault();
            this.sendMessage();
        });

        // Listener for receiving text messages
        const messageParams = {"type": "text"};
        this.manager.addMessageListener(messageParams, this.updateMessageBar);

        // Listener for new peers
        this.manager.on('videopeer', (peer) => {
            // Display video when a track is received from a peer
            peer.on('track', (track, streams) => {
                track.onunmute = () => {
                    this.createVideoElement(peer.client_id, peer.username);
                    this.attachVideoElement(peer.client_id, streams[0]);
                };
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

        // Button listeners
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
        await this.startUserMedia();
    }
}

function connectionInfoNode(peer) {
    const template = document.querySelector('#connection-info-template');
    const clone = template.content.cloneNode(true);

    const div = clone.querySelector('div');
    div.id = 'connection-info-' + peer.client_id;

    const button = clone.querySelector('button');
    button.dataset.target = '#connection-info-collapse-' + peer.client_id;
    button.innerHTML = peer.username;

    const infoDiv = clone.querySelector('div.collapse');
    infoDiv.id = 'connection-info-collapse-' + peer.client_id;
    infoDiv.querySelector('.info-username').innerHTML = peer.username;
    infoDiv.querySelector('.info-client-id').innerHTML = peer.client_id;
    infoDiv.querySelector('.info-connection-state').innerHTML = peer.connectionState;
    infoDiv.querySelector('.info-ice-connection-state').innerHTML = peer.iceConnectionState;
    infoDiv.querySelector('.info-ice-gathering-state').innerHTML = peer.iceGatheringState;
    infoDiv.querySelector('.info-signaling-state').innerHTML = peer.signalingState;

    return clone;
}

function dragVideo(evt) {
    evt.dataTransfer.setData('id', evt.target.id);
}

function allowVideoDrop(evt) {
    evt.preventDefault();
}

function dropVideo(evt, myId) {
    evt.preventDefault();

    const otherId = evt.dataTransfer.getData('id');
    const me = document.getElementById(myId);
    const other = document.getElementById(otherId);
    swapNodes(me, other);
}

function swapNodes(node1, node2) {
    const parent1 = node1.parentNode;
    const parent2 = node2.parentNode;

    const temp1 = document.createElement('span');
    const temp2 = document.createElement('span');

    parent1.insertBefore(temp1, node1);
    parent2.insertBefore(temp2, node2);
    parent1.insertBefore(node2, temp1);
    parent2.insertBefore(node1, temp2);

    parent1.removeChild(temp1);
    parent2.removeChild(temp2);
}

export {UI};

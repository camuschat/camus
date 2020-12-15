import EventEmitter from './EventEmitter';
import VideoPeer from './VideoPeer';
import MessageHandler from './MessageHandler.js';
import Signaler from './Signaler';

export default class Manager extends EventEmitter {
    constructor() {
        super();
        this.username = 'Major Tom';
        this.signaler = new Signaler();
        this.videoPeers = new Map();
        this.localVideoStream = new MediaStream();
        this.videoTrack = null;
        this.audioTrack = null;
        this.textMessages = [];
        this.messageHandler = new MessageHandler(this, this.signaler);
        this.id = null;
        this._iceServers = [];
    }

    setUsername(username) {
        this.username = username;

        const data = {receiver: 'ground control',
                      type: 'profile',
                      data: {username: this.username}
        };
        this.signaler.send(data);
    }

    setIceServers(iceServers) {
        this.iceServers = iceServers;
    }

    set iceServers(iceServers) {
        this._iceServers = iceServers;

        this.videoPeers.forEach(peer => {
            peer.iceServers = iceServers;
        });
    }

    get iceServers() {
        return this._iceServers;
    }

    async setAudioTrack(track) {
        await this.setTrack(track);
        this.audioTrack = track;
    }

    async setVideoTrack(track) {
        await this.setTrack(track);
        this.videoTrack = track;
    }

    async setTrack(track) {
        for (let peer of this.videoPeers.values()) {
            await peer.setTrack(track, this.localVideoStream);
        }
    }

    get audioEnabled() {
        return this.audioTrack && this.audioTrack.enabled;
    }

    set audioEnabled(enabled) {
        if (this.audioTrack) this.audioTrack.enabled = enabled;
    }

    get videoEnabled() {
        return this.videoTrack && this.videoTrack.enabled;
    }

    set videoEnabled(enabled) {
        if (this.videoTrack) this.videoTrack.enabled = enabled;
    }

    stopAudio() {
        if (this.audioTrack) {
            this.audioTrack.enabled = false;
            this.audioTrack.stop();
        }
    }

    stopVideo() {
        if (this.videoTrack) {
            this.videoTrack.enabled = false;
            this.videoTrack.stop();
        }
    }

    async createVideoPeer(client) {
        const peer = new VideoPeer(client, this.signaler, this.id < client.id, this.iceServers);
        this.videoPeers.set(client.id, peer);
        peer.connect();

        if (this.localVideoStream && this.videoTrack) {
            await peer.setTrack(this.videoTrack, this.localVideoStream);
        }

        if (this.localVideoStream && this.audioTrack) {
            await peer.setTrack(this.audioTrack, this.localVideoStream);
        }

        console.log('Created video peer ', peer.client_id);
        this.emit('videopeer', peer);

        return peer;
    }

    async getOrCreateVideoPeer(client) {
        if (!this.videoPeers.has(client.id)) {
            return await this.createVideoPeer(client);
        }

        return this.videoPeers.get(client.id);
    }

    removeVideoPeer(id) {
        const peer = this.videoPeers.get(id);
        if (peer) {
            peer.shutdown();
            this.videoPeers.delete(id);
            this.emit('videopeerremoved', peer);
        }
    }

    async findPeers() {
        const roomInfo = await this.get_room_info();
        await this.updatePeers(roomInfo);
    }

    async updatePeers(roomInfo) {
        // Remove peers not in room
        const roomClientIds = roomInfo.clients.map(({id}) => id);
        const peerClientIds = Array.from(this.videoPeers.keys());
        const removeIds = peerClientIds.filter(id => !roomClientIds.includes(id));

        removeIds.forEach((id) => {
            this.removeVideoPeer(id);
        });

        // Add peers in room
        for (const client of roomInfo.clients) {
            if (client.id !== this.id) {
                await this.getOrCreateVideoPeer(client);
            }
        }

        // Update information for each peer
        this.videoPeers.forEach((peer, peer_id) => {
            const client = roomInfo.clients.find(client => client.id === peer_id);
            if (client) {
                peer.username = client.username;
            }
        });
    }

    addMessageListener(messageParams, listener) {
        this.messageHandler.addMessageListener(messageParams, listener);
    }

    shutdownVideoPeers() {
        this.videoPeers.forEach((peer) => {
            peer.shutdown();
        });

        this.videoPeers.clear();
    }

    async get_self_id() {
        const time = new Date().getTime();
        const data = {"receiver": "ground control",
                    "type": "ping",
                    "data": time};
        const responseParams = {"sender": "ground control",
                            "type": "pong",
                            "data": time};
        const response = await this.signaler.sendReceive(data, responseParams);
        return response.receiver;

    }

    async get_room_info() {
        const data = {"receiver": "ground control",
                    "type": "get-room-info"};
        const responseParams = {"sender": "ground control",
                              "type": "room-info"};
        const response = await this.signaler.sendReceive(data, responseParams);
        return response.data;
    }

    async fetchIceServers() {
        const data = {
            'receiver': 'ground control',
            'type': 'get-ice-servers'
        }
        const responseParams = {
            'sender': 'ground control',
            'type': 'ice-servers'
        }
        const response = await this.signaler.sendReceive(data, responseParams);
        return response.data;
    }

    shutdown() {
        this.shutdownVideoPeers();
        this.signaler.shutdown();
    }

    async start() {
        // Set up message handler
        this.signaler.on('message', (message) => {
            this.messageHandler.handleMessage(message);
        });

        // Wait for websocket to open
        while (this.signaler.connectionState != 'open') {
            await new Promise(r => {setTimeout(r, 100)});
        }

        this.id = await this.get_self_id();
        this.iceServers = await this.fetchIceServers();
        await this.findPeers();
    }
}

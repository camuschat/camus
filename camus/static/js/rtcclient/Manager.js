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
        this.mediaTracks = new Map();
        this.localVideoStream = new MediaStream();
        this.textMessages = [];
        this.messageHandler = new MessageHandler(this, this.signaler);
        this.id = null;
        this._iceServers = [];
    }

    setUsername(username) {
        this.username = username;
        this.signaler.profile(username);
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

    addTrack(name, track) {
        if (this.mediaTracks.has(name)) {
            throw new Error(`Track with name "${name}" already exists.`);
        }

        // Add track to each peer
        for (let peer of this.videoPeers.values()) {
            peer.addTrack(track);
        }

        this.mediaTracks.set(name, track);
        this.localVideoStream.addTrack(track);
    }

    async replaceTrack(name, track) {
        if (!this.mediaTracks.has(name)) {
            throw new Error(`Track with name "${name}" does not exist.`);
        }

        const oldTrack = this.mediaTracks.get(name);

        // Replace track on each peer
        for (let peer of this.videoPeers.values()) {
            await peer.replaceTrack(oldTrack.id, track);
        }

        this.mediaTracks.set(name, track);
        this.localVideoStream.removeTrack(oldTrack);
        this.localVideoStream.addTrack(track);
    }

    async setTrack(name, track) {
        if (this.mediaTracks.has(name)) {
            await this.replaceTrack(name, track);
        } else {
            this.addTrack(name, track);
        }
    }

    removeTrack(name) {
        if (!this.mediaTracks.has(name)) {
            throw new Error(`Track with name "${name}" does not exist.`);
        }

        const track = this.mediaTracks.get(name);

        // Remove track from each peer
        for (let peer of this.videoPeers.values()) {
            peer.removeTrack(track.id);
        }

        this.mediaTracks.delete(name);
        this.localVideoStream.removeTrack(track);
    }

    stopTrack(name) {
        if (!this.mediaTracks.has(name)) {
            throw new Error(`Track with name "${name}" does not exist.`);
        }

        const track = this.mediaTracks.get(name);
        track.enabled = false;
        track.stop();
    }

    createVideoPeer(client) {
        const peer = new VideoPeer(
            client, this.signaler, this.id < client.id, this.iceServers,
            this.mediaTracks.values()
        );
        this.videoPeers.set(client.id, peer);

        console.log('Created video peer ', peer.client_id);
        this.emit('videopeer', peer);

        return peer;
    }

    getOrCreateVideoPeer(client) {
        if (!this.videoPeers.has(client.id)) {
            return this.createVideoPeer(client);
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
        const roomInfo = await this.signaler.get_room_info();
        this.updatePeers(roomInfo);
    }

    updatePeers(roomInfo) {
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
                this.getOrCreateVideoPeer(client);
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
        const response = await this.signaler.ping();
        return response.receiver;
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
        this.iceServers = await this.signaler.fetchIceServers();
        await this.findPeers();
    }
}

import EventEmitter from './EventEmitter';
import MediaPeer from './MediaPeer';
import MessageHandler from './MessageHandler';
import Signaler from './Signaler';

export default class Manager extends EventEmitter {
    constructor() {
        super();
        this.username = 'Major Tom';
        this.signaler = new Signaler();
        this.mediaPeers = new Map();
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

        this.mediaPeers.forEach(peer => {
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
        for (let peer of this.mediaPeers.values()) {
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
        for (let peer of this.mediaPeers.values()) {
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
        for (let peer of this.mediaPeers.values()) {
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

    createMediaPeer(client) {
        const peer = new MediaPeer(
            client, this.signaler, this.id < client.id, this.iceServers,
            this.mediaTracks.values()
        );
        this.mediaPeers.set(client.id, peer);

        console.log('Created video peer ', peer.client_id);
        this.emit('mediapeer', peer);

        return peer;
    }

    getOrCreateMediaPeer(client) {
        if (!this.mediaPeers.has(client.id)) {
            return this.createMediaPeer(client);
        }

        return this.mediaPeers.get(client.id);
    }

    removeMediaPeer(id) {
        const peer = this.mediaPeers.get(id);
        if (peer) {
            peer.shutdown();
            this.mediaPeers.delete(id);
            this.emit('mediapeerremoved', peer);
        }
    }

    async findPeers() {
        const roomInfo = await this.signaler.get_room_info();
        this.updatePeers(roomInfo);
    }

    updatePeers(roomInfo) {
        // Remove peers not in room
        const roomClientIds = roomInfo.clients.map(({id}) => id);
        const peerClientIds = Array.from(this.mediaPeers.keys());
        const removeIds = peerClientIds.filter(id => !roomClientIds.includes(id));

        removeIds.forEach((id) => {
            this.removeMediaPeer(id);
        });

        // Add peers in room
        for (const client of roomInfo.clients) {
            if (client.id !== this.id) {
                this.getOrCreateMediaPeer(client);
            }
        }

        // Update information for each peer
        this.mediaPeers.forEach((peer, peer_id) => {
            const client = roomInfo.clients.find(client => client.id === peer_id);
            if (client) {
                peer.username = client.username;
            }
        });
    }

    addMessageListener(messageParams, listener) {
        this.messageHandler.addMessageListener(messageParams, listener);
    }

    shutdownMediaPeers() {
        this.mediaPeers.forEach((peer) => {
            peer.shutdown();
        });

        this.mediaPeers.clear();
    }

    async get_self_id() {
        const response = await this.signaler.ping();
        return response.receiver;
    }

    shutdown() {
        this.shutdownMediaPeers();
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

import { Client, IceServer, Message, RoomInfo, Text } from './types';
import EventEmitter from './EventEmitter';
import MediaPeer from './MediaPeer';
import MessageHandler from './MessageHandler';
import Signaler from './Signaler';

export default class Manager extends EventEmitter {
    id: string;
    username: string;
    mediaPeers: Map<string, MediaPeer>;
    textMessages: Text[];
    signaler: Signaler;
    mediaTracks: Map<string, MediaStreamTrack>;
    localVideoStream: MediaStream;
    messageHandler: MessageHandler;
    private _iceServers: IceServer[];

    constructor() {
        super();
        this.username = 'Major Tom';
        this.signaler = new Signaler();
        this.mediaPeers = new Map();
        this.mediaTracks = new Map();
        this.localVideoStream = new MediaStream();
        this.textMessages = [];
        this.messageHandler = new MessageHandler(this, this.signaler);
        this.id = '';
        this._iceServers = [];
    }

    setUsername(username: string): void {
        this.username = username;
        this.signaler.profile(username);
    }

    setIceServers(iceServers: IceServer[]): void {
        this.iceServers = iceServers;
    }

    set iceServers(iceServers: IceServer[]) {
        this._iceServers = iceServers;

        this.mediaPeers.forEach((peer) => {
            peer.iceServers = iceServers;
        });
    }

    get iceServers(): IceServer[] {
        return this._iceServers;
    }

    addTrack(name: string, track: MediaStreamTrack): void {
        if (this.mediaTracks.has(name)) {
            throw new Error(`Track with name "${name}" already exists.`);
        }

        // Add track to each peer
        for (const peer of this.mediaPeers.values()) {
            peer.addTrack(track);
        }

        this.mediaTracks.set(name, track);
        this.localVideoStream.addTrack(track);
    }

    async replaceTrack(name: string, track: MediaStreamTrack): Promise<void> {
        if (!this.mediaTracks.has(name)) {
            throw new Error(`Track with name "${name}" does not exist.`);
        }

        const oldTrack = this.mediaTracks.get(name);

        // Replace track on each peer
        for (const peer of this.mediaPeers.values()) {
            await peer.replaceTrack(oldTrack!.id, track);
        }

        this.mediaTracks.set(name, track);
        this.localVideoStream.removeTrack(oldTrack!);
        this.localVideoStream.addTrack(track);
    }

    async setTrack(name: string, track: MediaStreamTrack): Promise<void> {
        if (this.mediaTracks.has(name)) {
            await this.replaceTrack(name, track);
        } else {
            this.addTrack(name, track);
        }
    }

    removeTrack(name: string): void {
        if (!this.mediaTracks.has(name)) {
            throw new Error(`Track with name "${name}" does not exist.`);
        }

        const track = this.mediaTracks.get(name);

        // Remove track from each peer
        for (const peer of this.mediaPeers.values()) {
            peer.removeTrack(track!.id);
        }

        this.mediaTracks.delete(name);
        this.localVideoStream.removeTrack(track!);
    }

    stopTrack(name: string): void {
        if (!this.mediaTracks.has(name)) {
            throw new Error(`Track with name "${name}" does not exist.`);
        }

        const track = this.mediaTracks.get(name);
        track!.enabled = false;
        track!.stop();
    }

    createMediaPeer(client: Client): MediaPeer {
        const peer = new MediaPeer(
            client,
            this.signaler,
            this.id < client.id,
            this.iceServers,
            [...this.mediaTracks.values()]
        );
        this.mediaPeers.set(client.id, peer);

        console.log('Created video peer ', peer.id);
        this.emit('mediapeer', peer);

        return peer;
    }

    getOrCreateMediaPeer(client: Client): MediaPeer {
        const existingPeer = this.mediaPeers.get(client.id);
        return existingPeer ? existingPeer : this.createMediaPeer(client);
    }

    removeMediaPeer(id: string): void {
        const peer = this.mediaPeers.get(id);
        if (peer) {
            peer.shutdown();
            this.mediaPeers.delete(id);
            this.emit('mediapeerremoved', peer);
        }
    }

    async findPeers(): Promise<void> {
        const roomInfo = await this.signaler.getRoomInfo();
        this.updatePeers(roomInfo);
    }

    updatePeers(roomInfo: RoomInfo): void {
        // Remove peers not in room
        const roomClientIds = roomInfo.clients.map(({ id }) => id);
        const peerClientIds = Array.from(this.mediaPeers.keys());
        const removeIds = peerClientIds.filter(
            (id) => !roomClientIds.includes(id)
        );

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
            const client = roomInfo.clients.find(
                (client) => client.id === peer_id
            );
            if (client) {
                peer.username = client.username;
            }
        });
    }

    addMessageListener(messageParams: object, listener: Function): void {
        this.messageHandler.addMessageListener(messageParams, listener);
    }

    shutdownMediaPeers(): void {
        this.mediaPeers.forEach((peer) => {
            peer.shutdown();
        });

        this.mediaPeers.clear();
    }

    async getSelfId(): Promise<string> {
        const response = await this.signaler.ping();
        return response.receiver;
    }

    shutdown(): void {
        this.shutdownMediaPeers();
        this.signaler.shutdown();
    }

    async start(): Promise<void> {
        // Set up message handler
        this.signaler.on('message', (message: Message) => {
            this.messageHandler.handleMessage(message);
        });

        // Wait for websocket to open
        while (this.signaler.connectionState != 'open') {
            await new Promise((r) => {
                setTimeout(r, 100);
            });
        }

        this.id = await this.getSelfId();
        this.iceServers = await this.signaler.fetchIceServers();
        await this.findPeers();
    }
}

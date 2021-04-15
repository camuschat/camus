import EventEmitter from './EventEmitter'

export default class MediaPeer extends EventEmitter {
    constructor(client, signaler, polite, iceServers=[], tracks=[]) {
        super();
        this.client_id = client.id;
        this._username = client.username;
        this.signaler = signaler;
        this.polite = polite;
        this.makingOffer = false;
        this.connection = null;
        this.audioTransceiver = null;
        this.videoTransceiver = null;
        this._iceServers = iceServers;

        this.createPeerConnection(iceServers);

        for (let track of tracks) {
            this.addTrack(track);
        }
    }

    set username(username) {
        this._username = username;
        this.emit('usernamechange', username);
    }

    get username() {
        return this._username;
    }

    set iceServers(iceServers) {
        this._iceServers = iceServers;
        try {
            this.connection.setConfiguration({
                iceServers
            });
            console.log(`[${this.client_id}] Updated connection configuration: `,
                this.connection.getConfiguration());

            this.restartIce();
        } catch (err) {
            console.error('Updating ICE servers failed: ', err);
        }
    }

    get iceServers() {
        return this._iceServers;
    }

    createPeerConnection(iceServers) {
        const config = {
            sdpSemantics: 'unified-plan',
            iceServers: iceServers,
        };
        this.connection = new RTCPeerConnection(config);

        // Handle incoming tracks from the peer
        this.connection.ontrack = ({track, streams}) => {
            console.log(`[${this.client_id}] ${track.kind} track ${track.id} received`);
            this.emit('track', track, streams);
        };

        this.connection.onconnectionstatechange = () => {
            console.log(`[${this.client_id}] Connection state: ${this.connection.connectionState}`);
            this.emit('connectionstatechange', this.connection.connectionState);
        };

        // Handle failed ICE connections
        this.connection.oniceconnectionstatechange = () => {
            console.log(`[${this.client_id}] Ice connection state: ${this.connection.iceConnectionState}`);
            if (this.connection.iceConnectionState === "failed") {
                this.connection.restartIce();
            }

            this.emit('iceconnectionstatechange', this.connection.iceConnectionState);
        };

        this.connection.onsignalingstatechange = () => {
            console.log(`[${this.client_id}] Signaling state: ${this.connection.signalingState}`);
            this.emit('signalingstatechange', this.connection.signalingState);
        };

        this.connection.onicegatheringstatechange = () => {
            console.log(`[${this.client_id}] Ice gathering state: ${this.connection.iceGatheringState}`);
            this.emit('icegatheringstatechange', this.connection.iceGatheringState);
        };

        // Handle (re)negotiation of the connection
        this.connection.onnegotiationneeded = async () => {
            console.log(`[${this.client_id}] onnegotiationneeded`);

            try {
                this.makingOffer = true;
                const offer = await this.connection.createOffer();
                if (this.connection.signalingState !== 'stable') return;
                await this.connection.setLocalDescription(offer);
                const description = this.connection.localDescription.toJSON();

                if (description.type === 'offer') {
                    console.log(`[${this.client_id}] onnegotiationneeded: send offer`);
                    this.signaler.offer(this.client_id, description);
                } else if (description.type === 'answer') {
                    console.log(`[${this.client_id}] onnegotiationneeded: send answer`);
                    this.signaler.answer(this.client_id, description);
                } else {
                    console.error('onnegotiationneeded: unknown description type');
                }
            } catch(err) {
                console.error(err);
            } finally {
                this.makingOffer = false;
            }
        };

        // Send ICE candidates as they are gathered
        this.connection.onicecandidate = ({candidate}) => {
            if (candidate) {
                this.signaler.icecandidate(this.client_id, candidate.toJSON());
            }
        };
    }

    connect() {
        // Adding transceivers triggers onnegotiationneeded()
        this.videoTransceiver = this.connection.addTransceiver('video');
        this.audioTransceiver = this.connection.addTransceiver('audio');
    }

    get connectionState() {
        return this.connection.connectionState;
    }

    get iceConnectionState() {
        return this.connection.iceConnectionState;
    }

    get iceGatheringState() {
        return this.connection.iceGatheringState;
    }

    get signalingState() {
        return this.connection.signalingState;
    }

    async onOffer(offer) {
        /* Perfect negotiation:
         * 1. If we are ready to accept the offer (i.e. we're not in the process of making our
         *    own offer), then set the remote description with the offer.
         * 2. Otherwise, there is an "offer collision". If we are the impolite peer, ignore the
         *    offer. If we are polite, roll back the local description and set the remote
         *    description with the offer.
         * 3. If we aren't ignoring the offer, respond to the peer with an answer.
         */

        if (offer.type !== 'offer') {
            throw new Error('type mismatch');
        }

        try {
            const offerCollision = this.makingOffer || this.connection.signalingState !== 'stable';

            if (offerCollision) {
                if (!this.polite) {
                    return;
                }

                // Polite peer rolls back local description and accepts remote offer
                await Promise.all([
                    this.connection.setLocalDescription({type: "rollback"}),
                    this.connection.setRemoteDescription(offer)
                ]);

            } else {
                // No collision, so accept the remote offer
                await this.connection.setRemoteDescription(offer);
            }

            // Create an answer to the remote offer and send it
            const answer = await this.connection.createAnswer();
            await this.connection.setLocalDescription(answer);

            const description = this.connection.localDescription.toJSON();
            this.signaler.answer(this.client_id, description);
        } catch(err) {
            console.error(err);
        }
    }

    async onAnswer(answer) {
        try {
            await this.connection.setRemoteDescription(answer);
        } catch(err) {
            console.error(err);
        }
    }

    async onIceCandidate(candidate) {
        try {
            await this.connection.addIceCandidate(candidate);
        } catch(err) {
            console.error(err);
        }
    }

    addTrack(track) {
        this.connection.addTrack(track);
    }

    getTracks() {
        return this.connection.getSenders().map(sender => sender.track);
    }

    async replaceTrack(id, track) {
        const trackSender = this.connection.getSenders().find(sender =>
            sender.track && sender.track.id === id);

        if (trackSender) {
            console.log('Replacing track on sender ', trackSender);
            await trackSender.replaceTrack(track);
        } else {
            throw new Error(`Track with id "${id}" does not exist.`);
        }
    }

    removeTrack(id) {
        const trackSender = this.connection.getSenders().find(sender =>
            sender.track && sender.track.id === id);

        if (trackSender) {
            console.log('Removing track');
            this.connection.removeTrack(trackSender);
        } else {
            throw new Error(`Track with id "${id}" does not exist.`);
        }
    }

    disableRemoteTrack(id) {
        const transceiver = this.connection.getTransceivers().find(t =>
            t.receiver && t.receiver.track && t.receiver.track.id === id
        );

        if (transceiver) {
            console.log('Disable remote track');
            transceiver.direction = 'sendonly';
        } else {
            throw new Error(`Track with id "${id}" does not exist.`);
        }
    }

    enableRemoteTrack(id) {
        const transceiver = this.connection.getTransceivers().find(t =>
            t.receiver && t.receiver.track && t.receiver.track.id === id
        );

        if (transceiver) {
            console.log('Enable remote track');
            transceiver.direction = 'sendrecv';
        } else {
            throw new Error(`Track with id "${id}" does not exist.`);
        }
    }

    disableRemoteVideo() {
        this.connection.getTransceivers().filter(t =>
            t.receiver && t.receiver.track && t.receiver.track.kind === 'video'
        ).forEach(t =>
            t.direction = 'sendonly'
        );
    }

    enableRemoteVideo() {
        this.connection.getTransceivers().filter(t =>
            t.receiver && t.receiver.track && t.receiver.track.kind === 'video'
        ).forEach(t =>
            t.direction = 'sendrecv'
        );
    }

    restartIce() {
        this.connection.restartIce();
        console.log(`[${this.client_id}] Restarted ICE`);
    }

    shutdown() {
        // Clean up RTCPeerConnection
        if (this.connection !== null) {
            this.connection.getReceivers().forEach(receiver => {
                if(receiver.track) receiver.track.stop();
            });

            this.connection.close();
        }

        // Say bye to peer
        this.signaler.bye(this.client_id);

        this.emit('shutdown');

        console.log('Shutdown connection with peer ' + this.client_id);
    }
}

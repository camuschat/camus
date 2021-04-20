import { Answer, Client, IceCandidate, IceServer, Offer } from './types';
import EventEmitter from './EventEmitter';
import Signaler from './Signaler';

export default class MediaPeer extends EventEmitter {
    id: string;
    signaler: Signaler;
    connection: RTCPeerConnection;
    makingOffer: boolean;
    readonly polite: boolean;
    private _username: string;
    private _iceServers: IceServer[];

    constructor(
        client: Client,
        signaler: Signaler,
        polite: boolean,
        iceServers: IceServer[] = [],
        tracks: MediaStreamTrack[] = []
    ) {
        super();
        this.id = client.id;
        this._username = client.username;
        this.signaler = signaler;
        this.polite = polite;
        this.makingOffer = false;
        this._iceServers = iceServers;
        this.connection = this.createPeerConnection(iceServers);

        for (const track of tracks) {
            this.addTrack(track);
        }
    }

    set username(username: string) {
        this._username = username;
        this.emit('usernamechange', username);
    }

    get username(): string {
        return this._username;
    }

    set iceServers(iceServers: IceServer[]) {
        this._iceServers = iceServers;
        try {
            this.connection.setConfiguration({
                iceServers,
            });
            console.log(
                `[${this.id}] Updated connection configuration: `,
                this.connection.getConfiguration()
            );

            this.restartIce();
        } catch (err) {
            console.error('Updating ICE servers failed: ', err);
        }
    }

    get iceServers(): IceServer[] {
        return this._iceServers;
    }

    createPeerConnection(iceServers: IceServer[]): RTCPeerConnection {
        const config = {
            sdpSemantics: 'unified-plan',
            iceServers: iceServers,
        };
        const connection = new RTCPeerConnection(config);

        // Handle incoming tracks from the peer
        connection.ontrack = ({ track, streams }) => {
            console.log(
                `[${this.id}] ${track.kind} track ${track.id} received`
            );
            this.emit('track', track, streams);
        };

        connection.onconnectionstatechange = () => {
            console.log(
                `[${this.id}] Connection state: ${connection.connectionState}`
            );
            this.emit('connectionstatechange', connection.connectionState);
        };

        // Handle failed ICE connections
        connection.oniceconnectionstatechange = () => {
            console.log(
                `[${this.id}] Ice connection state: ${connection.iceConnectionState}`
            );
            if (connection.iceConnectionState === 'failed') {
                this.restartIce();
            }

            this.emit(
                'iceconnectionstatechange',
                connection.iceConnectionState
            );
        };

        connection.onsignalingstatechange = () => {
            console.log(
                `[${this.id}] Signaling state: ${connection.signalingState}`
            );
            this.emit('signalingstatechange', connection.signalingState);
        };

        connection.onicegatheringstatechange = () => {
            console.log(
                `[${this.id}] Ice gathering state: ${connection.iceGatheringState}`
            );
            this.emit('icegatheringstatechange', connection.iceGatheringState);
        };

        // Handle (re)negotiation of the connection
        connection.onnegotiationneeded = async () => {
            console.log(`[${this.id}] onnegotiationneeded`);

            try {
                this.makingOffer = true;
                const offer = await connection.createOffer();
                if (connection.signalingState !== 'stable') return;
                await connection.setLocalDescription(offer);
                const description = connection.localDescription!.toJSON();

                if (description.type === 'offer') {
                    console.log(`[${this.id}] onnegotiationneeded: send offer`);
                    this.signaler.offer(this.id, description);
                } else if (description.type === 'answer') {
                    console.log(
                        `[${this.id}] onnegotiationneeded: send answer`
                    );
                    this.signaler.answer(this.id, description);
                } else {
                    console.error(
                        'onnegotiationneeded: unknown description type'
                    );
                }
            } catch (err) {
                console.error(err);
            } finally {
                this.makingOffer = false;
            }
        };

        // Send ICE candidates as they are gathered
        connection.onicecandidate = ({ candidate }) => {
            if (candidate) {
                this.signaler.icecandidate(this.id, candidate.toJSON());
            }
        };

        return connection;
    }

    connect(): void {
        // Adding transceivers triggers onnegotiationneeded()
        this.connection.addTransceiver('video');
        this.connection.addTransceiver('audio');
    }

    get connectionState(): string {
        return this.connection.connectionState;
    }

    get iceConnectionState(): string {
        return this.connection.iceConnectionState;
    }

    get iceGatheringState(): string {
        return this.connection.iceGatheringState;
    }

    get signalingState(): string {
        return this.connection.signalingState;
    }

    async onOffer(offer: Offer): Promise<void> {
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
            const offerCollision =
                this.makingOffer || this.connection.signalingState !== 'stable';

            if (offerCollision) {
                if (!this.polite) {
                    return;
                }

                // Polite peer rolls back local description and accepts remote offer
                await Promise.all([
                    this.connection.setLocalDescription({ type: 'rollback' }),
                    this.connection.setRemoteDescription(offer),
                ]);
            } else {
                // No collision, so accept the remote offer
                await this.connection.setRemoteDescription(offer);
            }

            // Create an answer to the remote offer and send it
            const answer = await this.connection.createAnswer();
            await this.connection.setLocalDescription(answer);

            const description = this.connection.localDescription!.toJSON();
            this.signaler.answer(this.id, description);
        } catch (err) {
            console.error(err);
        }
    }

    async onAnswer(answer: Answer): Promise<void> {
        try {
            await this.connection.setRemoteDescription(answer);
        } catch (err) {
            console.error(err);
        }
    }

    async onIceCandidate(candidate: IceCandidate): Promise<void> {
        try {
            await this.connection.addIceCandidate(candidate);
        } catch (err) {
            console.error(err);
        }
    }

    addTrack(track: MediaStreamTrack): void {
        this.connection.addTrack(track);
    }

    getTracks(): MediaStreamTrack[] {
        return this.connection
            .getSenders()
            .map((sender) => sender.track)
            .filter((track) => track !== null) as MediaStreamTrack[];
    }

    async replaceTrack(id: string, track: MediaStreamTrack): Promise<void> {
        const trackSender = this.connection
            .getSenders()
            .find((sender) => sender.track && sender.track.id === id);

        if (trackSender) {
            console.log('Replacing track on sender ', trackSender);
            await trackSender.replaceTrack(track);
        } else {
            throw new Error(`Track with id "${id}" does not exist.`);
        }
    }

    removeTrack(id: string): void {
        const trackSender = this.connection
            .getSenders()
            .find((sender) => sender.track && sender.track.id === id);

        if (trackSender) {
            console.log('Removing track');
            this.connection.removeTrack(trackSender);
        } else {
            throw new Error(`Track with id "${id}" does not exist.`);
        }
    }

    disableRemoteTrack(id: string): void {
        const transceiver = this.connection
            .getTransceivers()
            .find(
                (t) =>
                    t.receiver && t.receiver.track && t.receiver.track.id === id
            );

        if (transceiver) {
            console.log('Disable remote track');
            transceiver.direction = 'sendonly';
        } else {
            throw new Error(`Track with id "${id}" does not exist.`);
        }
    }

    enableRemoteTrack(id: string): void {
        const transceiver = this.connection
            .getTransceivers()
            .find(
                (t) =>
                    t.receiver && t.receiver.track && t.receiver.track.id === id
            );

        if (transceiver) {
            console.log('Enable remote track');
            transceiver.direction = 'sendrecv';
        } else {
            throw new Error(`Track with id "${id}" does not exist.`);
        }
    }

    disableRemoteVideo(): void {
        this.connection
            .getTransceivers()
            .filter(
                (t) =>
                    t.receiver &&
                    t.receiver.track &&
                    t.receiver.track.kind === 'video'
            )
            .forEach((t) => (t.direction = 'sendonly'));
    }

    enableRemoteVideo(): void {
        this.connection
            .getTransceivers()
            .filter(
                (t) =>
                    t.receiver &&
                    t.receiver.track &&
                    t.receiver.track.kind === 'video'
            )
            .forEach((t) => (t.direction = 'sendrecv'));
    }

    restartIce(): void {
        if ('restartIce' in this.connection) {
            (this.connection as any).restartIce();
            console.log(`[${this.id}] Restarted ICE`);
        }
    }

    shutdown(): void {
        // Clean up RTCPeerConnection
        if (this.connection !== null) {
            this.connection.getReceivers().forEach((receiver) => {
                if (receiver.track) receiver.track.stop();
            });

            this.connection.close();
        }

        // Say bye to peer
        this.signaler.bye(this.id);

        this.emit('shutdown');

        console.log('Shutdown connection with peer ' + this.id);
    }
}

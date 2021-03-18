import { MediaPeer } from '../../../js/rtcclient';

describe('Test ideoPeer', () => {
    it('can initialize a connection', () => {
        const signaler = createSignaler();
        const peer = new MediaPeer({id: 'abc', username: 'Bill'}, signaler, false);

        expect(peer.client_id).to.equal('abc');
        expect(peer.username).to.equal('Bill');
        expect(peer.polite).to.equal(false);
        expect(peer.connection).to.be.instanceOf(RTCPeerConnection);
    });

    it('can negotiate a connection', {
        defaultCommandTimeout: 10000,
        retries: 2
    }, () => {
        const signaler = createSignaler();
        const peer1 = new MediaPeer({id: 'abc', username: 'Bill'}, signaler, false);
        const peer2 = new MediaPeer({id: 'def', username: 'Ted'}, signaler, true);

        // Note: the mapping between id and peer appears reversed here since the
        // client_id refers to the other peer
        signaler.peers.set(peer2.client_id, peer1);
        signaler.peers.set(peer1.client_id, peer2);

        // Begin negotiation
        peer1.connect();
        peer2.connect();

        // Retry assertions until connection is established (or Cypress times out)
        cy.wrap(peer1).should('have.property', 'connectionState', 'connected');
        cy.wrap(peer2).should('have.property', 'connectionState', 'connected');
        cy.wrap(peer1).should('have.property', 'iceConnectionState', 'connected');
        cy.wrap(peer2).should('have.property', 'iceConnectionState', 'connected');
    });

    it('can add multiple audio and video tracks', () => {
        const peer = createDummyPeer();
        const videoTrackA = createVideoTrack();
        const videoTrackB = createVideoTrack();
        const audioTrackA = createAudioTrack();
        const audioTrackB = createAudioTrack();

        peer.addTrack(videoTrackA);
        peer.addTrack(videoTrackB);
        peer.addTrack(audioTrackA);
        peer.addTrack(audioTrackB);

        const peerTracks = peer.getTracks();
        expect(peerTracks).includes(videoTrackA);
        expect(peerTracks).includes(videoTrackB);
        expect(peerTracks).includes(audioTrackA);
        expect(peerTracks).includes(audioTrackB);
    });

    it('can add and remove a track', () => {
        const peer = createDummyPeer();
        const track = createVideoTrack();

        peer.addTrack(track);
        expect(peer.getTracks()).includes(track);

        peer.removeTrack(track.id);
        expect(peer.getTracks()).to.not.includes(track);
    });

    it('can add and replace a track', async () => {
        const peer = createDummyPeer();
        const trackA = createVideoTrack();
        const trackB = createVideoTrack();

        peer.addTrack(trackA);
        expect(peer.getTracks()).includes(trackA);

        await peer.replaceTrack(trackA.id, trackB);
        expect(peer.getTracks()).not.to.include(trackA);
        expect(peer.getTracks()).includes(trackB);
    });
});

function createSignaler() {
    const signaler =  {
        peers: new Map(),
        offer: (receiver, data) => {
            signaler.peers.get(receiver).onOffer(data).then();
        },
        answer: (receiver, data) => {
            signaler.peers.get(receiver).onAnswer(data).then();
        },
        icecandidate: (receiver, data) => {
            signaler.peers.get(receiver).onIceCandidate(data).then();
        },
    };

    return signaler;
}

function createVideoTrack() {
    return new RTCPeerConnection().addTransceiver('video').receiver.track;
}

function createAudioTrack() {
    return new RTCPeerConnection().addTransceiver('audio').receiver.track;
}

function createDummyPeer() {
    const signaler = createSignaler();
    const peer = new MediaPeer({id: 'abc', username: 'Bill'}, signaler, false);
    peer.connection.onnegotiationneeded = () => {};  // Disable negotiation for this test
    peer.connect();  // Trigger setup of transceivers
    return peer;
}

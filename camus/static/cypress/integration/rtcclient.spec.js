import {EventEmitter, VideoPeer} from '../../js/rtcclient.js';

describe('Test EventEmitter', () => {
    it('can add a listener', () => {
        const ee = new EventEmitter();
        const callback = () => {};

        ee.on('event', callback);

        expect(ee.listeners('event')).to.include(callback);
    });

    it('can remove a listener', () => {
        const ee = new EventEmitter();
        const callback = () => {};

        ee.on('event', callback);
        ee.removeListener('event', callback);

        expect(ee.listeners('event')).not.to.include(callback);
    });
});

describe('Test VideoPeer', () => {
    it('can initialize a connection', () => {
        const signaler = createSignaler();
        const peer = new VideoPeer({id: 'abc', username: 'Bill'}, signaler, false);

        expect(peer.client_id).to.equal('abc');
        expect(peer.username).to.equal('Bill');
        expect(peer.polite).to.equal(false);
        expect(peer.connection).to.be.instanceOf(RTCPeerConnection);
    });

    it('can negotiate a connection', {defaultCommandTimeout: 10000}, () => {
        const signaler = createSignaler();
        const peer1 = new VideoPeer({id: 'abc', username: 'Bill'}, signaler, false);
        const peer2 = new VideoPeer({id: 'def', username: 'Ted'}, signaler, true);

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

    it('can set audio and video tracks', async () => {
        const signaler = createSignaler();
        const peer = new VideoPeer({id: 'abc', username: 'Bill'}, signaler, false);
        peer.connection.onnegotiationneeded = () => {};  // Disable negotiation for this test
        peer.connect();  // Trigger setup of transceivers

        for (let count = 0; count < 2; count++) {
            // Create dummy audio and video tracks
            const videoTrack = new RTCPeerConnection().addTransceiver('video').receiver.track;
            const audioTrack = new RTCPeerConnection().addTransceiver('audio').receiver.track;

            // Set audio and video tracks for the peer
            await peer.setTrack(videoTrack);
            await peer.setTrack(audioTrack);

            expect(peer.getTrack('video')).to.equal(videoTrack);
            expect(peer.getTrack('audio')).to.equal(audioTrack);
        }
    });
});


function createSignaler() {
    const signaler =  {
        peers: new Map(),
        send: ({receiver, type, data}) => {
            if (type === 'offer') {
                signaler.peers.get(receiver).onOffer(data).then();
            }
            else if (type == 'answer') {
                signaler.peers.get(receiver).onAnswer(data).then();
            }
            else if (type == 'icecandidate') {
                signaler.peers.get(receiver).onIceCandidate(data).then();
            }
        }
    };

    return signaler;
}

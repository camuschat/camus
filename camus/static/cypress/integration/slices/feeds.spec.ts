import { createStore } from 'redux';
import reducer, {
    addFeed,
    removeFeed,
    updateFeed,
    swapFeeds,
    setLocalAudio,
    setLocalVideo,
    disableRemoteVideo,
    enableRemoteVideo
} from '../../../js/slices/feeds';

describe('Test feeds slice of Redux store', () => {
    it('can add a feed', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        const feed = {
            id: '1234',
            videoStream: null,
            audioStream: null,
            videoEnabled: true,
            audioMuted: false
        };
        store.dispatch(addFeed(feed));

        // Get result
        const state = store.getState();
        const storedFeed = state.find(feed => feed.id === '1234');

        // Verify result
        expect(storedFeed).is.not.undefined;
        expect(storedFeed.id).to.equal('1234');
        expect(storedFeed.videoStream).is.null;
        expect(storedFeed.audioStream).is.null;
        expect(storedFeed.videoEnabled).is.true;
        expect(storedFeed.audioMuted).is.false;
    });

    it('can remove a feed', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: '1234',
                videoStream: null,
                audioStream: null,
                videoEnabled: true,
                audioMuted: false
            }]
        );

        // Test
        store.dispatch(removeFeed('1234'));

        // Get result
        const state = store.getState();
        const storedFeed = state.find(feed => feed.id === '1234');

        // Verify result
        expect(storedFeed).is.undefined;
    });

    it('can update a feed', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: '1234',
                videoStream: null,
                audioStream: null,
                videoEnabled: true,
                audioMuted: false
            }]
        );

        // Test
        const audioStream = new MediaStream();
        const updatedFeed = {
            id: '1234',
            audioStream,
            audioMuted: true
        };
        store.dispatch(updateFeed(updatedFeed));

        // Get result
        const state = store.getState();
        const storedFeed = state.find(feed => feed.id === '1234');

        // Verify result
        expect(storedFeed).is.not.undefined;
        expect(storedFeed.id).to.equal('1234');
        expect(storedFeed.videoStream).is.null;
        expect(storedFeed.audioStream).to.equal(audioStream);
        expect(storedFeed.videoEnabled).is.true;
        expect(storedFeed.audioMuted).is.true;
    });

    it('can swap two feeds', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: '1234',
                videoStream: null,
                audioStream: null,
                videoEnabled: true,
                audioMuted: false
            },
            {
                id: '5678',
                videoStream: null,
                audioStream: null,
                videoEnabled: true,
                audioMuted: false
            }]
        );

        // Test
        store.dispatch(swapFeeds({id1: '1234', id2: '5678'}));

        // Get result
        const state = store.getState();
        const idx1234 = state.findIndex(feed => feed.id === '1234');
        const idx5678 = state.findIndex(feed => feed.id === '5678');

        // Verify result
        expect(idx1234).to.equal(1);
        expect(idx5678).to.equal(0);
    });

    it('can set the local audio', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: 'local',
                videoStream: null,
                audioStream: null,
                videoEnabled: true,
                audioMuted: false
            }]
        );
        // Create dummy audio track
        const audioTrack = new RTCPeerConnection().addTransceiver('audio').receiver.track;

        // Test
        store.dispatch(setLocalAudio(audioTrack));

        // Get result
        const state = store.getState();
        const audioStream = state.find(feed => feed.id === 'local').audioStream;
        const audioStreamTrack = audioStream.getTracks()[0];

        // Verify result
        expect(audioStreamTrack).to.equal(audioTrack);
        expect(audioStreamTrack.kind).to.equal('audio');
    });

    it('can set the local video', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: 'local',
                videoStream: null,
                audioStream: null,
                videoEnabled: true,
                audioMuted: false
            }]
        );
        // Create dummy video track
        const videoTrack = new RTCPeerConnection().addTransceiver('video').receiver.track;

        // Test
        store.dispatch(setLocalVideo(videoTrack));

        // Get result
        const state = store.getState();
        const videoStream = state.find(feed => feed.id === 'local').videoStream;
        const videoStreamTrack = videoStream.getTracks()[0];

        // Verify result
        expect(videoStreamTrack).to.equal(videoTrack);
        expect(videoStreamTrack.kind).to.equal('video');
    });

    it('can disable a remote video feed', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: '1234',
                videoStream: null,
                audioStream: null,
                videoEnabled: true,
                audioMuted: false
            }]
        );

        // Test
        store.dispatch(disableRemoteVideo('1234'));

        // Get result
        const state = store.getState();
        const storedFeed = state.find(feed => feed.id === '1234');

        // Verify result
        expect(storedFeed.videoEnabled).is.false;
    });

    it('can enable a remote video feed', () => {
        // Setup
        const store = createStore(
            reducer,
            [{
                id: '1234',
                videoStream: null,
                audioStream: null,
                videoEnabled: false,
                audioMuted: false
            }]
        );

        // Test
        store.dispatch(enableRemoteVideo('1234'));

        // Get result
        const state = store.getState();
        const storedFeed = state.find(feed => feed.id === '1234');

        // Verify result
        expect(storedFeed.videoEnabled).is.true;
    });
});

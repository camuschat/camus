import { createStore } from 'redux';
import reducer, {
    updateAudioDevice,
    updateVideoDevice,
    updateDisplayDevice,
    setResolution
} from '../../../js/slices/devices';

describe('Test devices slice of Redux store', () => {
    it('can update the local audio device', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        const audioDevice = {
            active: true,
            id: '1234'
        };
        store.dispatch(updateAudioDevice(audioDevice));

        // Get result
        const state = store.getState();

        // Verify result
        expect(state.audio.active).is.true;
        expect(state.audio.id).equals('1234');
    });

    it('can update the local video device', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        const videoDevice = {
            active: true,
            id: '5678',
            maxResolution: 1080
        };
        store.dispatch(updateVideoDevice(videoDevice));

        // Get result
        const state = store.getState();

        // Verify result
        expect(state.video.active).is.true;
        expect(state.video.id).equals('5678');
        expect(state.video.maxResolution).equals(1080);
    });

    it('can update the local display device', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        const displayDevice = {
            active: true
        };
        store.dispatch(updateDisplayDevice(displayDevice));

        // Get result
        const state = store.getState();

        // Verify result
        expect(state.display.active).is.true;
    });

    it('can set the local video resolution', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        store.dispatch(setResolution(1080));

        // Get result
        const state = store.getState();

        // Verify result
        expect(state.video.resolution).equals(1080);
    });
});

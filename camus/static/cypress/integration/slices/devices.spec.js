import {createStore} from 'redux';
import reducer, {setAudioDevice, setVideoDevice} from '../../../js/slices/devices';

describe('Test devices slice of Redux store', () => {
    it('can set the local audio device', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        store.dispatch(setAudioDevice('1234'));

        // Get result
        const state = store.getState();

        // Verify result
        expect(state.audioDeviceId).equals('1234');
    });

    it('can set the local video device', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        store.dispatch(setVideoDevice('5678'));

        // Get result
        const state = store.getState();

        // Verify result
        expect(state.videoDeviceId).equals('5678');
    });
});

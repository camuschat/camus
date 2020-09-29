import {createStore} from 'redux';
import reducer, {updateAudioDevice, updateVideoDevice} from '../../../js/slices/devices';

describe('Test devices slice of Redux store', () => {
    it('can update the local audio device', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        store.dispatch(updateAudioDevice({id: '1234'}));

        // Get result
        const state = store.getState();

        // Verify result
        expect(state.audio.id).equals('1234');
    });

    it('can update the local video device', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        store.dispatch(updateVideoDevice({id: '5678'}));

        // Get result
        const state = store.getState();

        // Verify result
        expect(state.video.id).equals('5678');
    });
});

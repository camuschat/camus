import { createStore } from 'redux';
import reducer, { addChatMessage } from '../../../js/slices/messages';

describe('Test messages slice of Redux store', () => {
    it('can add a chat message', () => {
        // Setup
        const store = createStore(reducer);

        // Test
        const chatMessage = {
            from: 'Major Tom',
            timestamp: '10101010',
            text: 'Hello world!'
        };
        store.dispatch(addChatMessage(chatMessage));

        // Get result
        const state = store.getState();

        // Verify result
        expect(state).includes(chatMessage);
    });
});

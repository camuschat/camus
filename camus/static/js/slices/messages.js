import { createSlice } from '@reduxjs/toolkit';

const messagesSlice = createSlice({
    name: 'messages',
    initialState: [],
    reducers: {
        addChatMessage(state, action) {
            state.push(action.payload);
        },
        sendChatMessage() {
            // This action should be caught by middleware to pass the message
            // to the Manager
            return;
        }
    }
});

const { actions, reducer } = messagesSlice;
export const {
    addChatMessage,
    sendChatMessage
} = actions;
export default reducer;

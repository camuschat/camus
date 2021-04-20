import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Message {
    from: string;
    timestamp: number;
    text: string;
}

const initialState: Message[] = [];

const messagesSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        addChatMessage(state, { payload }: PayloadAction<Message>) {
            state.push(payload);
        },
        sendChatMessage(state, { payload }: PayloadAction<string>) {
            // This action should be caught by middleware to pass the message
            // to the Manager
            return;
        },
    },
});

const { actions, reducer } = messagesSlice;
export const { addChatMessage, sendChatMessage } = actions;
export default reducer;

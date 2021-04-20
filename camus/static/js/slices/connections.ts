import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Connection {
    id: string;
    connectionState: string;
    iceConnectionState: string;
    iceGatheringState: string;
    signalingState: string;
}

const initialState: Connection[] = [];

const connectionsSlice = createSlice({
    name: 'connections',
    initialState,
    reducers: {
        addConnection(state, { payload }: PayloadAction<Connection>) {
            state.push(payload);
        },
        removeConnection(state, { payload }: PayloadAction<string>) {
            const id = payload;
            return state.filter((connection) => connection.id !== id);
        },
        updateConnection(state, { payload }: PayloadAction<{ id: string }>) {
            const { id } = payload;
            const connection = state.find((c) => c.id === id);
            Object.assign(connection, payload);
        },
    },
});

const { actions, reducer } = connectionsSlice;
export const { addConnection, removeConnection, updateConnection } = actions;
export default reducer;

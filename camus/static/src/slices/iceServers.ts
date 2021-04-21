import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// A unique ID will be assigned to every server object
let id = 0;

export interface IceServer {
    id?: number;
    urls: string[];
    enabled: boolean;
    kind: string;
    username?: string;
    credential?: string;
}

const initialState: IceServer[] = [];

const iceServersSlice = createSlice({
    name: 'iceServers',
    initialState,
    reducers: {
        addIceServer(state, { payload }: PayloadAction<IceServer>) {
            const server = Object.assign({ id: id++, enabled: true }, payload);
            state.push(server);
        },
        removeIceServer(state, { payload }: PayloadAction<number>) {
            const id = payload;
            return state.filter((server) => server.id !== id);
        },
        updateIceServer(state, { payload }: PayloadAction<{ id: number }>) {
            const { id } = payload;
            const server = state.find((server) => server.id === id);
            Object.assign(server, payload);
        },
    },
});

const { actions, reducer } = iceServersSlice;
export const { addIceServer, removeIceServer, updateIceServer } = actions;
export default reducer;

import { createSlice } from '@reduxjs/toolkit';

// A unique ID will be assigned to every server object
let id = 0;

const iceServersSlice = createSlice({
    name: 'iceServers',
    initialState: [],
    reducers: {
        addIceServer(state, action) {
            const server = Object.assign({id: id++, enabled: true}, action.payload);
            state.push(server)
        },
        removeIceServer(state, action) {
            const id = action.payload;
            return state.filter(server => server.id !== id);
        },
        updateIceServer(state, action) {
            const {id} = action.payload;
            const server = state.find(server => server.id === id);
            Object.assign(server, action.payload);
        }
    }
});

const {actions, reducer} = iceServersSlice;
export const {
    addIceServer,
    removeIceServer,
    updateIceServer
} = actions;
export default reducer;

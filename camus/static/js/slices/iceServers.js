import { createSlice } from '@reduxjs/toolkit';

// A unique ID will be assigned to every server object
let id = 0;

const iceServersSlice = createSlice({
    name: 'iceServers',
    initialState: {
        stunServers: [],
        turnServers: []
    },
    reducers: {
        addStunServer(state, action) {
            const server = Object.assign({id: id++}, action.payload);
            state.stunServers.push(server)
        },
        removeStunServer(state, action) {
            const id = action.payload;
            state.stunServers = state.stunServers.filter(server => server.id !== id);
        },
        updateStunServer(state, action) {
            const {id} = action.payload;
            const server = state.stunServers.find(server => server.id === id);
            Object.assign(server, action.payload);
        },
        addTurnServer(state, action) {
            const server = Object.assign({id: id++}, action.payload);
            state.turnServers.push(server)
        },
        removeTurnServer(state, action) {
            const id = action.payload;
            state.turnServers = state.turnServers.filter(server => server.id !== id);
        },
        updateTurnServer(state, action) {
            const {id} = action.payload;
            const server = state.turnServers.find(server => server.id === id);
            Object.assign(server, action.payload);
        }
    }
});

const {actions, reducer} = iceServersSlice;
export const {
    addStunServer,
    removeStunServer,
    updateStunServer,
    addTurnServer,
    removeTurnServer,
    updateTurnServer,
} = actions;
export default reducer;

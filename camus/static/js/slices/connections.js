import { createSlice } from '@reduxjs/toolkit';

const connectionsSlice = createSlice({
    name: 'connections',
    initialState: [],
    reducers: {
        addConnection(state, action) {
            state.push(action.payload);
        },
        removeConnection(state, action) {
            const id = action.payload;
            return state.filter(connection => connection.id !== id);
        },
        updateConnection(state, action) {
            const {id} = action.payload;
            const connection = state.find(c => c.id === id);
            Object.assign(connection, action.payload);
        }
    }
});

const { actions, reducer } = connectionsSlice;
export const {
    addConnection,
    removeConnection,
    updateConnection
} = actions;
export default reducer;

import { createSlice } from '@reduxjs/toolkit';

const devicesSlice = createSlice({
    name: 'devices',
    initialState: {
        audio: {
            id: ''
        },
        video: {
            id: '',
            maxResolution: 0
        },
        display: {
            maxResolution: 0
        }
    },
    reducers: {
        updateAudioDevice(state, action) {
            Object.assign(state.audio, action.payload);
        },
        updateVideoDevice(state, action) {
            Object.assign(state.video, action.payload);
        },
        updateDisplayDevice(state, action) {
            Object.assign(state.display, action.payload);
        }
    }
});

const {actions, reducer} = devicesSlice;
export const {updateAudioDevice, updateVideoDevice, updateDisplayDevice} = actions;
export default reducer;

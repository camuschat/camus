import { createSlice } from '@reduxjs/toolkit';

const devicesSlice = createSlice({
    name: 'devices',
    initialState: {
        audio: {
            active: false,
            id: ''
        },
        video: {
            active: false,
            id: '',
            resolution: 480,
            maxResolution: 0
        },
        display: {
            active: false
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
        },
        setResolution(state, action) {
            state.video.resolution = action.payload;
        }
    }
});

const {actions, reducer} = devicesSlice;
export const {updateAudioDevice, updateVideoDevice, updateDisplayDevice, setResolution} = actions;
export default reducer;

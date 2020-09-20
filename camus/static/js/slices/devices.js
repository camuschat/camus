import { createSlice } from '@reduxjs/toolkit';

const devicesSlice = createSlice({
    name: 'devices',
    initialState: {
        audioDeviceId: '',
        videoDeviceId: ''
    },
    reducers: {
        setAudioDevice(state, action) {
            state.audioDeviceId = action.payload;
        },
        setVideoDevice(state, action) {
            state.videoDeviceId = action.payload;
        }
    }
});

const {actions, reducer} = devicesSlice;
export const {setAudioDevice, setVideoDevice} = actions;
export default reducer;

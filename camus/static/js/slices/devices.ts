import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Device {
    active: boolean;
}

export interface AudioDevice extends Device {
    id: string;
}

export interface VideoDevice extends Device {
    id: string;
    resolution: number;
    maxResolution: number;
}

export interface DisplayDevice extends Device {}

interface DevicesState {
    audio: AudioDevice;
    video: VideoDevice;
    display: DisplayDevice;
}

const initialState: DevicesState = {
    audio: {
        active: false,
        id: '',
    },
    video: {
        active: false,
        id: '',
        resolution: 480,
        maxResolution: 0,
    },
    display: {
        active: false,
    },
};

const devicesSlice = createSlice({
    name: 'devices',
    initialState,
    reducers: {
        updateAudioDevice(state, { payload }: PayloadAction<object>) {
            Object.assign(state.audio, payload);
        },
        updateVideoDevice(state, { payload }: PayloadAction<object>) {
            Object.assign(state.video, payload);
        },
        updateDisplayDevice(state, { payload }: PayloadAction<object>) {
            Object.assign(state.display, payload);
        },
        setResolution(state, { payload }: PayloadAction<number>) {
            state.video.resolution = payload;
        },
    },
});

const { actions, reducer } = devicesSlice;
export const {
    updateAudioDevice,
    updateVideoDevice,
    updateDisplayDevice,
    setResolution,
} = actions;
export default reducer;

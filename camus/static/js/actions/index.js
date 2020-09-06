import {SET_MANAGER, SET_USERNAME, SET_AUDIO_DEVICE, SET_VIDEO_DEVICE} from './actionTypes';

export function setManager(manager) {
    return {
        type: SET_MANAGER,
        payload: {
            manager
        }
    };
}

export function setUsername(username) {
    return {
        type: SET_USERNAME,
        payload: {
            username
        }
    };
}

export function setAudioDevice(audioDeviceId) {
    return {
        type: SET_AUDIO_DEVICE,
        payload: {
            audioDeviceId
        }
    };
}

export function setVideoDevice(videoDeviceId) {
    return {
        type: SET_VIDEO_DEVICE,
        payload: {
            videoDeviceId
        }
    };
}

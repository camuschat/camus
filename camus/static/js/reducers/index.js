import {SET_MANAGER, SET_USERNAME, SET_AUDIO_DEVICE, SET_VIDEO_DEVICE} from '../actions/actionTypes';

const initialState = {
    manager: null,
    username: '',
    audioDeviceId: '',
    videoDeviceId: '',
    users: [{id: 'local', username: 'Me'}],
    chatMessages: [],
    feeds: [{id: 'local', audioStream: null, videoStream: null}],
    connections: []
};

export default function rootReducer(state=initialState, action) {
    switch(action.type) {
        case SET_MANAGER: {
            const {manager} = action.payload;
            return {
                ...state,
                manager
            }
        }
        case SET_USERNAME: {
            const {username} = action.payload;
            return {
                ...state,
                username
            };
        }
        case SET_AUDIO_DEVICE: {
            const {audioDeviceId} = action.payload;
            return {
                ...state,
                audioDeviceId
            };
        }
        case SET_VIDEO_DEVICE: {
            const {videoDeviceId} = action.payload;
            return {
                ...state,
                videoDeviceId
            };
        }
        default:
            return state;
    }
}

import {SET_MANAGER, SET_USERNAME, SET_AUDIO_DEVICE, SET_VIDEO_DEVICE,
    ADD_USER, UPDATE_USER, ADD_CHAT_MESSAGE, SEND_CHAT_MESSAGE,
    ADD_CONNECTION, REMOVE_CONNECTION, UPDATE_CONNECTION,
    ADD_FEED, REMOVE_FEED, UPDATE_FEED, SWAP_FEEDS,
    SET_AUDIO_TRACK, SET_VIDEO_TRACK} from './actionTypes';

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

export function addUser(user) {
    return {
        type: ADD_USER,
        payload: {
            user
        }
    };
}

export function updateUser(user) {
    return {
        type: UPDATE_USER,
        payload: {
            user
        }
    };
}

export function addChatMessage(message) {
    return {
        type: ADD_CHAT_MESSAGE,
        payload: {
            message
        }
    };
}

export function sendChatMessage(message) {
    return {
        type: SEND_CHAT_MESSAGE,
        payload: {
            message
        }
    };
}

export function addConnection(connection) {
    return {
        type: ADD_CONNECTION,
        payload: {
            connection
        }
    };
}

export function removeConnection(id) {
    return {
        type: REMOVE_CONNECTION,
        payload: {
            id
        }
    };
}

export function updateConnection(id, kind, status) {
    return {
        type: UPDATE_CONNECTION,
        payload: {
            id,
            kind,
            status
        }
    };
}

export function addFeed(feed) {
    return {
        type: ADD_FEED,
        payload: {
            feed
        }
    };
}

export function removeFeed(id) {
    return {
        type: REMOVE_FEED,
        payload: {
            id
        }
    };
}

export function updateFeed(feed) {
    return {
        type: UPDATE_FEED,
        payload: {
            feed
        }
    };
}

export function swapFeeds(id1, id2) {
    return {
        type: SWAP_FEEDS,
        payload: {
            id1,
            id2
        }
    };
}

export function setAudioTrack(track) {
    return {
        type: SET_AUDIO_TRACK,
        payload: {
            track
        }
    };
}

export function setVideoTrack(track) {
    return {
        type: SET_VIDEO_TRACK,
        payload: {
            track
        }
    };
}

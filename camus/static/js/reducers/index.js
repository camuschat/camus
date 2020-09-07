import {SET_MANAGER, SET_USERNAME, SET_AUDIO_DEVICE, SET_VIDEO_DEVICE,
    ADD_USER, UPDATE_USER, ADD_CHAT_MESSAGE,
    ADD_CONNECTION, REMOVE_CONNECTION, UPDATE_CONNECTION,
    ADD_FEED, REMOVE_FEED, UPDATE_FEED, SWAP_FEEDS,
    SET_AUDIO_TRACK, SET_VIDEO_TRACK} from '../actions/actionTypes';

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
        case ADD_USER: {
            const {user} = action.payload;
            const users = state.users.concat(user);
            return {
                ...state,
                users 
            }
        }
        case UPDATE_USER: {
            const {user} = action.payload;
            const users = state.users.map(u => {
                if (user.id === u.id) {
                    return user;
                }
                return u;
            });
            return {
                ...state,
                users
            }
        }
        case ADD_CHAT_MESSAGE: {
            const {message} = action.payload;
            const chatMessages = state.chatMessages.concat(message);
            return {
                ...state,
                chatMessages
            };

        }
        case ADD_CONNECTION: {
            const {connection} = action.payload;
            const connections = state.connections.concat(connection);
            return {
                ...state,
                connections
            }
        }
        case REMOVE_CONNECTION: {
            const {id} = action.payload;
            const connections = state.connections.filter(connection => connection.id !== id);
            return {
                ...state,
                connections
            };
        }
        case UPDATE_CONNECTION: {
            const {id, kind, status} = action.payload;
            const connections = state.connections.map(connection => {
                if (id === connection.id) {
                    connection[kind] = status;
                }
                return connection
            });
            return {
                ...state,
                connections
            };
        }
        case ADD_FEED: {
            const {feed} = action.payload;
            const feeds = state.feeds.concat(feed);
            return {
                ...state,
                feeds
            }
        }
        case REMOVE_FEED: {
            const {id} = action.payload;
            const feeds = state.feeds.filter(feed => feed.id !== id);
            return {
                ...state,
                feeds
            };
        }
        case UPDATE_FEED: {
            const {id} = action.payload.feed;
            const feeds = state.feeds.map(feed => {
                if (id === feed.id) {
                    const newFeed = Object.assign({}, feed, action.payload.feed);
                    return newFeed;
                }
                return feed;
            });
            return {
                ...state,
                feeds
            };
        }
        case SWAP_FEEDS: {
            const {id1, id2} = action.payload;
            const feeds = state.feeds.slice();
            const idx1 = feeds.findIndex(feed => feed.id === id1);
            const idx2 = feeds.findIndex(feed => feed.id === id2);
            [feeds[idx1], feeds[idx2]] = [feeds[idx2], feeds[idx1]];

            return {
                ...state,
                feeds
            };
        }
        case SET_VIDEO_TRACK: {
            const {track} = action.payload;
            const feeds = state.feeds.map(feed => {
                if (feed.id === 'local') {
                    const stream = track ? new MediaStream([track]) : null;
                    feed.videoStream = stream;
                }
                return feed;
            });
            return {
                ...state,
                feeds
            };
        }
        default:
            return state;
    }
}

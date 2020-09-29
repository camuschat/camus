import { createSlice } from '@reduxjs/toolkit';

const feedsSlice = createSlice({
    name: 'feeds',
    initialState: [{
        id: 'local',
        audioStream: null,
        videoStream: null,
        audioMuted: true,
        videoMuted: false,
        maxResolution: 720,
        resolution: 720 
    }],
    reducers: {
        addFeed(state, action) {
            state.push(action.payload);
        },
        removeFeed(state, action) {
            const id = action.payload;
            return state.filter(feed => feed.id !== id);
        },
        updateFeed(state, action) {
            const {id} = action.payload;
            const feed = state.find(f => f.id === id);
            Object.assign(feed, action.payload);

            if (feed.videoStream) {
                window.videoTrack = feed.videoStream.getVideoTracks()[0]
                console.log('FEED RESOLUTION: ', feed.videoStream.getVideoTracks()[0].getSettings().height);
            }
        },
        swapFeeds(state, action) {
            const {id1, id2} = action.payload;
            const idx1 = state.findIndex(feed => feed.id === id1);
            const idx2 = state.findIndex(feed => feed.id === id2);
            [state[idx1], state[idx2]] = [state[idx2], state[idx1]];
        },
        setLocalAudio(state, action) {
            const track = action.payload;
            const stream = track ? new MediaStream([track]) : null;
            state.find(feed => feed.id === 'local').audioStream = stream;
        },
        setLocalVideo(state, action) {
            const track = action.payload;
            const stream = track ? new MediaStream([track]) : null;
            const localFeed = state.find(feed => feed.id === 'local');
            localFeed.videoStream = stream;
            localFeed.resolution = track ? track.getSettings().height : localFeed.resolution;
        },
        setResolution(state, action) {
            const {id, resolution} = action.payload;
            const feed = state.find(f => f.id === id);
            feed.resolution = resolution;
        }
    }
});

const {actions, reducer} = feedsSlice;
export const {addFeed, removeFeed, updateFeed, swapFeeds, setLocalAudio, setLocalVideo, setResolution} = actions;
export default reducer;

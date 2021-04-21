import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Feed {
    id: string;
    audioStream: MediaStream | null;
    videoStream: MediaStream | null;
    audioMuted: boolean;
    videoEnabled: boolean;
}

const initialState: Feed[] = [
    {
        id: 'local',
        audioStream: null,
        videoStream: null,
        audioMuted: true,
        videoEnabled: true,
    },
];

const feedsSlice = createSlice({
    name: 'feeds',
    initialState,
    reducers: {
        addFeed(state, { payload }: PayloadAction<Feed>) {
            state.push(payload);
        },
        removeFeed(state, { payload }: PayloadAction<string>) {
            const id = payload;
            return state.filter((feed) => feed.id !== id);
        },
        updateFeed(state, { payload }: PayloadAction<{ id: string }>) {
            const { id } = payload;
            const feed = state.find((f) => f.id === id);
            Object.assign(feed, payload);
        },
        swapFeeds(
            state,
            { payload }: PayloadAction<{ id1: string; id2: string }>
        ) {
            const { id1, id2 } = payload;
            const idx1 = state.findIndex((feed) => feed.id === id1);
            const idx2 = state.findIndex((feed) => feed.id === id2);
            [state[idx1], state[idx2]] = [state[idx2], state[idx1]];
        },
        setLocalAudio(
            state,
            { payload }: PayloadAction<MediaStreamTrack | null>
        ) {
            const track = payload;
            const stream = track ? new MediaStream([track]) : null;
            const localFeed = state.find((feed) => feed.id === 'local');
            if (localFeed) {
                if (localFeed.audioStream) {
                    localFeed.audioStream
                        .getTracks()
                        .forEach((track) => track.stop());
                }
                localFeed.audioStream = stream;
            }
        },
        setLocalVideo(
            state,
            { payload }: PayloadAction<MediaStreamTrack | null>
        ) {
            const track = payload;
            const stream = track ? new MediaStream([track]) : null;
            const localFeed = state.find((feed) => feed.id === 'local');
            if (localFeed) {
                if (localFeed.videoStream) {
                    localFeed.videoStream
                        .getTracks()
                        .forEach((track) => track.stop());
                }
                localFeed.videoStream = stream;
            }
        },
        disableRemoteVideo(state, { payload }: PayloadAction<string>) {
            const id = payload;
            const feed = state.find((feed) => feed.id === id);
            if (feed) {
                feed.videoEnabled = false;
            }
        },
        enableRemoteVideo(state, { payload }: PayloadAction<string>) {
            const id = payload;
            const feed = state.find((feed) => feed.id === id);
            if (feed) {
                feed.videoEnabled = true;
            }
        },
    },
});

const { actions, reducer } = feedsSlice;
export const {
    addFeed,
    removeFeed,
    updateFeed,
    swapFeeds,
    setLocalAudio,
    setLocalVideo,
    disableRemoteVideo,
    enableRemoteVideo,
} = actions;
export default reducer;

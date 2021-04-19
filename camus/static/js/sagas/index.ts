import {
    apply,
    put,
    takeEvery,
    takeLatest,
    getContext,
    select,
} from 'redux-saga/effects';
import { Manager, MediaPeer } from '../rtcclient';
import { setUsername } from '../slices/users';
import { sendChatMessage } from '../slices/messages';
import { Feed, setLocalAudio, setLocalVideo } from '../slices/feeds';
import { setResolution } from '../slices/devices';
import { disableRemoteVideo, enableRemoteVideo } from '../slices/feeds';
import {
    addIceServer,
    removeIceServer,
    updateIceServer,
    IceServer,
} from '../slices/iceServers';
import { PayloadAction } from '@reduxjs/toolkit';

export default function* rootSaga() {
    yield takeLatest(setUsername.type, doSetUsername);
    yield takeEvery(sendChatMessage.type, doSendChatMessage);
    yield takeLatest(setLocalAudio.type, doSetLocalAudio);
    yield takeLatest(setLocalVideo.type, doSetLocalVideo);
    yield takeLatest(setResolution.type, doSetResolution);
    yield takeLatest(disableRemoteVideo.type, doDisableRemoteVideo);
    yield takeLatest(enableRemoteVideo.type, doEnableRemoteVideo);
    yield takeEvery(addIceServer.type, doSetIceServers);
    yield takeEvery(removeIceServer.type, doSetIceServers);
    yield takeEvery(updateIceServer.type, doSetIceServers);
}

function* doSetUsername({ payload }: PayloadAction<string>) {
    const manager: Manager = yield getContext('manager');
    const username = payload;

    try {
        yield apply(manager, manager.setUsername, [username]);
        yield put({ type: 'MANAGER_UPDATED' });
    } catch (err) {
        yield put({ type: 'MANAGER_ERROR', payload: err });
    }
}

function* doSendChatMessage({ payload }: PayloadAction<string>) {
    const manager: Manager = yield getContext('manager');
    const message = payload;
    const from = manager.username;

    try {
        yield apply(manager.signaler, manager.signaler.text, [message, from]);
        yield put({ type: 'MANAGER_UPDATED' });
    } catch (err) {
        yield put({ type: 'MANAGER_ERROR', payload: err });
    }
}

function* doSetLocalAudio({ payload }: PayloadAction<MediaStreamTrack | null>) {
    const manager: Manager = yield getContext('manager');
    const track = payload;

    try {
        if (track) {
            yield apply(manager, manager.setTrack, ['audio', track]);
        } else {
            yield apply(manager, manager.stopTrack, ['audio']);
        }

        yield put({ type: 'MANAGER_UPDATED' });
    } catch (err) {
        yield put({ type: 'MANAGER_ERROR', payload: err });
    }
}

function* doSetLocalVideo({ payload }: PayloadAction<MediaStreamTrack | null>) {
    const manager: Manager = yield getContext('manager');
    const track = payload;

    try {
        if (track) {
            yield apply(manager, manager.setTrack, ['video', track]);
        } else {
            yield apply(manager, manager.stopTrack, ['video']);
        }

        yield put({ type: 'MANAGER_UPDATED' });
    } catch (err) {
        yield put({ type: 'MANAGER_ERROR', payload: err });
    }
}

function* doSetResolution({ payload }: PayloadAction<number>) {
    const resolution = payload;

    try {
        const localFeed: Feed = yield select((state) =>
            state.feeds.find((feed: Feed) => feed.id === 'local')
        );

        if (localFeed.videoStream) {
            const track = localFeed.videoStream.getVideoTracks()[0];
            const constraints = {
                height: { ideal: resolution },
                width: { ideal: (resolution * 4) / 3 },
            };
            yield apply(track, track.applyConstraints, [constraints]);
        }
        yield put({ type: 'RESOLUTION_UPDATED' });
    } catch (err) {
        console.error(err);
        yield put({ type: 'ERROR', payload: err });
    }
}

function* doDisableRemoteVideo({ payload }: PayloadAction<string>) {
    const manager: Manager = yield getContext('manager');
    const id = payload;

    try {
        const peer: MediaPeer = manager.mediaPeers.get(id) as MediaPeer;
        yield apply(peer, peer.disableRemoteVideo, []);
        yield put({ type: 'PEER_UPDATED' });
    } catch (err) {
        yield put({ type: 'PEER_ERROR', payload: err });
    }
}

function* doEnableRemoteVideo({ payload }: PayloadAction<string>) {
    const manager: Manager = yield getContext('manager');
    const id = payload;

    try {
        const peer: MediaPeer = manager.mediaPeers.get(id) as MediaPeer;
        yield apply(peer, peer.enableRemoteVideo, []);
        yield put({ type: 'PEER_UPDATED' });
    } catch (err) {
        yield put({ type: 'PEER_ERROR', payload: err });
    }
}

function* doSetIceServers() {
    const manager: Manager = yield getContext('manager');
    const iceServers: IceServer[] = yield select((state) => state.iceServers);
    const servers = iceServers
        .filter((server) => {
            return server.enabled;
        })
        .map((server) => {
            return {
                urls: server.urls,
                username: server.username,
                credential: server.credential,
            };
        }) as IceServer[];

    try {
        yield apply(manager, manager.setIceServers, [servers]);
        yield put({ type: 'MANAGER_UPDATED' });
    } catch (err) {
        console.log(err);
        yield put({ type: 'MANAGER_ERROR', payload: err });
    }
}

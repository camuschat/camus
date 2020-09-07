import {all, call, put, select, takeLatest} from 'redux-saga/effects';
import {SET_USERNAME, SEND_CHAT_MESSAGE, SET_AUDIO_TRACK, SET_VIDEO_TRACK} from '../actions/actionTypes';

export default function* rootSaga() {
    yield all([
        watchSetUsername(),
        watchSendChatMessage(),
        watchSetAudioTrack(),
        watchSetVideoTrack()
    ]);
}

function* watchSetUsername() {
    yield takeLatest(SET_USERNAME, setUsername);
}

function* setUsername(action) {
    const {manager} = yield select();

    try {
        manager.setUsername(action.payload.username);
        yield put({type: 'MANAGER_UPDATED'});
    } catch (err) {
        yield put({type: 'MANAGER_ERROR', payload: err});
    }
}

function* watchSendChatMessage() {
    yield takeLatest(SEND_CHAT_MESSAGE, sendChatMessage);
}

function* sendChatMessage(action) {
    const {manager} = yield select();
    const {message} = action.payload;

    try {
        const time = new Date().getTime();
        const data = {
            receiver: 'room',
            type: 'text',
            data: {
                from: manager.username,
                time: time,
                text: message
            }
        };

        const send = manager.signaler.send.bind(manager.signaler);
        yield call(send, data);
        yield put({type: 'MANAGER_UPDATED'});
    } catch (err) {
        yield put({type: 'MANAGER_ERROR', payload: err});
    }
}

function* watchSetAudioTrack() {
    yield takeLatest(SET_AUDIO_TRACK, setAudioTrack);
}

function* setAudioTrack(action) {
    const {manager} = yield select();
    const {track} = action.payload;

    try {
        if (track) {
            manager.setAudioTrack(track).then();
        } else {
            manager.stopAudio();
        }

        yield put({type: 'MANAGER_UPDATED'});
    } catch(err) {
        yield put({type: 'MANAGER_ERROR', payload: err});
    }
}

function* watchSetVideoTrack() {
    yield takeLatest(SET_VIDEO_TRACK, setVideoTrack);
}

function* setVideoTrack(action) {
    const {manager} = yield select();
    const {track} = action.payload;

    try {
        if (track) {
            manager.setVideoTrack(track).then();
        } else {
            manager.stopVideo();
        }

        yield put({type: 'MANAGER_UPDATED'});
    } catch(err) {
        yield put({type: 'MANAGER_ERROR', payload: err});
    }
}

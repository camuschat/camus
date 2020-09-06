import {all, put, select, takeLatest} from 'redux-saga/effects';
import {SET_USERNAME} from '../actions/actionTypes';

export default function* rootSaga() {
    yield all([
        watchSetUsername()
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
        console.error(err);
        yield put({type: 'MANAGER_ERROR', payload: err});
    }
}

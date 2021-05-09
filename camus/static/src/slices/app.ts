import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultLocale } from '../i18n';

interface AppState {
    didEnterRoom: boolean;
    locale: string;
}

const initialState: AppState = {
    didEnterRoom: false,
    locale: defaultLocale,
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        enterRoom(state) {
            state.didEnterRoom = true;
        },
        setLocale(state, { payload }: PayloadAction<string>) {
            state.locale = payload;
        },
    },
});

const { actions, reducer } = appSlice;
export const { enterRoom, setLocale } = actions;
export default reducer;

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
    id: string;
    username: string;
}

const initialState: User[] = [
    {
        id: 'local',
        username: 'Me',
    },
];

const usersSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        addUser(state, { payload }: PayloadAction<User>) {
            state.push(payload);
        },
        updateUser(state, { payload }: PayloadAction<{ id: string }>) {
            const { id } = payload;
            const user = state.find((user) => user.id === id);
            Object.assign(user, payload);
        },
        setUsername(state, { payload }: PayloadAction<string>) {
            const username = payload;
            state.find((user) => user.id === 'local')!.username = username;
        },
    },
});

const { actions, reducer } = usersSlice;
export const { addUser, updateUser, setUsername } = actions;
export default reducer;

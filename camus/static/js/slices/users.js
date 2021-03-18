import { createSlice } from '@reduxjs/toolkit';

const usersSlice = createSlice({
    name: 'users',
    initialState: [{id: 'local', username: 'Me'}],
    reducers: {
        addUser(state, action) {
            state.push(action.payload);
        },
        updateUser(state, action) {
            const user = action.payload;
            return state.map(u => {
                if (user.id === u.id) {
                    return user;
                }
                return u;
            });
        },
        setUsername(state, action) {
            const username = action.payload;
            state.find(user => user.id === 'local').username = username;
        }
    }
});

const { actions, reducer } = usersSlice;
export const {
    addUser,
    updateUser,
    setUsername
} = actions;
export default reducer;

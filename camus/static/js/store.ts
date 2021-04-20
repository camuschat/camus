import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { Manager } from './rtcclient';
import connectionsReducer from './slices/connections';
import devicesReducer from './slices/devices';
import feedsReducer from './slices/feeds';
import iceServersReducer from './slices/iceServers';
import messagesReducer from './slices/messages';
import usersReducer from './slices/users';

// Create RTC connection manager
export const manager = new Manager();

// Create Redux Saga middleware, passing it the manager
export const sagaMiddleware = createSagaMiddleware({
    context: {
        manager,
    },
});

// Set up the Redux store
export const store = configureStore({
    reducer: {
        devices: devicesReducer,
        users: usersReducer,
        messages: messagesReducer,
        feeds: feedsReducer,
        iceServers: iceServersReducer,
        connections: connectionsReducer,
    },
    middleware: [sagaMiddleware],
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

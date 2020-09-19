'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { Manager } from './rtcclient.js';
import App from './components/App.js';
import connectionsReducer from './slices/connections';
import devicesReducer from './slices/devices';
import feedsReducer from './slices/feeds';
import messagesReducer from './slices/messages';
import usersReducer from './slices/users';
import rootSaga from './sagas';

window.addEventListener('unhandledrejection', (event) => {
    console.log('An unhandled error occurred');
    console.log(event.promise);
    console.log(event.reason);

    //alert('An unrecoverable error occurred. Please refresh the page to re-join the room.');
});

// Create RTC connection manager
const manager = new Manager();

// Create Redux Saga middleware, passing it the manager
const sagaMiddleware = createSagaMiddleware({
    context: {
        manager
    }
});

const middleware = [
    sagaMiddleware
];

// Set up the Redux store
const store = configureStore({
    reducer: {
        devices: devicesReducer,
        users: usersReducer,
        messages: messagesReducer,
        feeds: feedsReducer,
        connections: connectionsReducer
    },
    middleware
});

// Start Redux Saga
sagaMiddleware.run(rootSaga);

// Render our React app, passing it the Redux store
ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <App manager={manager}/>
        </Provider>
    </React.StrictMode>,
    document.getElementById('react-root')
);

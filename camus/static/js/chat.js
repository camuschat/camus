'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux';
import store from './store';
import {Manager} from './rtcclient.js';
import App from './components/App.js';

var manager = new Manager();

window.addEventListener('unhandledrejection', (event) => {
    console.log('An unhandled error occurred');
    console.log(event.promise);
    console.log(event.reason);

    //alert('An unrecoverable error occurred. Please refresh the page to re-join the room.');
});

ReactDOM.render(
    <React.StrictMode>
        <Provider store={store}>
            <App manager={manager}/>
        </Provider>
    </React.StrictMode>,
    document.getElementById('react-root')
);

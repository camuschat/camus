'use strict';

import React from "react";
import ReactDOM from "react-dom";

import {Manager} from './rtcclient.js';
import {UI} from './ui.js';
import App from './components/App.js';

var manager = new Manager();
var ui = new UI(manager);

window.addEventListener('unhandledrejection', (event) => {
    console.log('An unhandled error occurred');
    console.log(event.promise);
    console.log(event.reason);

    //alert('An unrecoverable error occurred. Please refresh the page to re-join the room.');
});

window.addEventListener('load', async () => {
    await ui.start();
    await manager.start();
});

window.addEventListener('beforeunload', () => {
    manager.shutdown();
});

ReactDOM.render(
  <React.StrictMode>
    <App
        manager={manager}
    />
  </React.StrictMode>,
  document.getElementById('react-root')
);

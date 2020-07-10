'use strict';

import {Manager} from './rtcclient.js';
import {UI} from './ui.js';

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

'use strict';

import {Manager} from './rtcclient.js';
import {UI} from './ui.js';

window.addEventListener('unhandledrejection', function(event) {
    console.log('An unhandled error occurred');
    console.log(event.promise);
    console.log(event.reason);

    //alert('An unrecoverable error occurred. Please refresh the page to re-join the room.');
});

window.addEventListener('load', function () {
    const profileForm = document.querySelector('#user-profile-modal form');
    profileForm.addEventListener('submit', (evt) => {
        evt.preventDefault();
        ui.saveUserProfile();
    });

    const messageForm = document.querySelector('#message-bar form');
    messageForm.addEventListener('submit', (evt) => {
        evt.preventDefault();
        ui.sendMessage();
    });
});

window.addEventListener('beforeunload', async function(event) {
    await manager.shutdown();
});


async function start() {
    await ui.start();
    await manager.start();
}

var manager = new Manager();
var ui = new UI(manager);
start();

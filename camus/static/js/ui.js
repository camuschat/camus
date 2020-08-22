'use strict';

class UI {
    constructor(manager) {
        this.manager = manager;
        this.videoMode = 'off';
        this.audioMode = 'off';
    }

    promptUserName() {
        $('#user-profile-modal').modal('show');
    }

    saveUserProfile() {
        const username = document.querySelector('#username-input').value;
        this.manager.setUsername(username);

        $('#user-profile-modal').modal('hide');
    }

    async start() {
        // Listner for user profile dialog
        const profileForm = document.querySelector('#user-profile-modal form');
        profileForm.addEventListener('submit', (evt) => {
            evt.preventDefault();
            this.saveUserProfile();
        });

        this.promptUserName();
    }
}

function dragVideo(evt) {
    evt.dataTransfer.setData('id', evt.target.id);
}

function allowVideoDrop(evt) {
    evt.preventDefault();
}

function dropVideo(evt, myId) {
    evt.preventDefault();

    const otherId = evt.dataTransfer.getData('id');
    const me = document.getElementById(myId);
    const other = document.getElementById(otherId);
    swapNodes(me, other);
}

function swapNodes(node1, node2) {
    const parent1 = node1.parentNode;
    const parent2 = node2.parentNode;

    const temp1 = document.createElement('span');
    const temp2 = document.createElement('span');

    parent1.insertBefore(temp1, node1);
    parent2.insertBefore(temp2, node2);
    parent1.insertBefore(node2, temp1);
    parent2.insertBefore(node1, temp2);

    parent1.removeChild(temp1);
    parent2.removeChild(temp2);
}

export {UI};

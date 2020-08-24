'use strict';

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

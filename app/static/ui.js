'use strict';

function attachVideoElement(id, track) {
    let videoelement = document.getElementById(id);
    videoelement.srcObject = track;

    videoelement.addEventListener("click", function(evt) {
        // Move video element in and out of center stage on click
        let stage = document.getElementById('video-stage');
        let thumbs = document.getElementById('video-thumbs');

        let stageVideo = stage.firstElementChild;
        console.log('videoelement', videoelement);
        console.log('stageVideo', stageVideo);
        if (stageVideo != null) {
            thumbs.append(stageVideo);
        }

        if (videoelement !== stageVideo) {
            stage.append(videoelement);
        }
    });
}

function createVideoElement(id) {
    let videoelement = document.createElement('video');
    videoelement.id = id;
    videoelement.autoplay = 'true';
    videoelement.style.width = '100%';
    videoelement.playsinline = 'true';
    let videoThumbs = document.getElementById('video-thumbs');
    videoThumbs.appendChild(videoelement);
}

//async function startUI() {
//}

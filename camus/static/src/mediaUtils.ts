interface UserMediaTracks {
    audio: MediaStreamTrack | null;
    video: MediaStreamTrack | null;
}

export const RESOLUTIONS = [2160, 1080, 720, 480, 360, 240];

export async function getCameras(): Promise<MediaDeviceInfo[]> {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((device) => device.kind === 'videoinput');
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function getMics(): Promise<MediaDeviceInfo[]> {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter((device) => device.kind === 'audioinput');
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function hasCamera(): Promise<boolean> {
    const cameras = await getCameras();
    return cameras.length > 0;
}

export async function hasMic(): Promise<boolean> {
    const mics = await getMics();
    return mics.length > 0;
}

export async function getUserMedia(
    constraints?: MediaStreamConstraints
): Promise<UserMediaTracks> {
    constraints = constraints ? constraints : { audio: true, video: true };
    const audioConstraints = constraints.audio
        ? (await hasMic()) && constraints.audio
        : false;
    const videoConstraints = constraints.video
        ? (await hasMic()) && constraints.video
        : false;
    constraints = {
        audio: audioConstraints,
        video: videoConstraints,
    };

    let stream;
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
        console.error(err);
        return { audio: null, video: null };
    }

    const videoTrack = stream
        .getTracks()
        .find((track) => track.kind === 'video');
    const audioTrack = stream
        .getTracks()
        .find((track) => track.kind === 'audio');

    return { audio: audioTrack || null, video: videoTrack || null };
}

export async function getUserVideo(
    constraints?: MediaTrackConstraints
): Promise<MediaStreamTrack | null> {
    const newConstraints = constraints ? constraints : true;
    const { video } = await getUserMedia({
        audio: false,
        video: newConstraints,
    });
    return video;
}

export async function getUserAudio(
    constraints?: MediaTrackConstraints
): Promise<MediaStreamTrack | null> {
    const newConstraints = constraints ? constraints : true;
    const { audio } = await getUserMedia({
        audio: newConstraints,
        video: false,
    });
    return audio;
}

export async function getDisplayMedia(): Promise<MediaStreamTrack | null> {
    // TODO: accept constraints
    const constraints = {
        video: { cursor: 'always' },
        audio: false,
    };

    let stream: MediaStream;
    try {
        // @ts-ignore (See https://github.com/microsoft/TypeScript/issues/33232)
        stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    } catch (err) {
        console.error(err);
        return null;
    }

    const videoTrack = stream
        .getTracks()
        .find((track) => track.kind === 'video');
    return videoTrack || null;
}

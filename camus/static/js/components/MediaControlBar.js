import React, { Component } from 'react';
import {getUserVideo, getUserAudio, getDisplayMedia} from '../mediaUtils.js';

export default class MediaControlBar extends Component {
    constructor(props) {
        super(props);

        const {
            videoDeviceId,
            audioDeviceId
        } = this.props;

        console.log('videoDeviceId', videoDeviceId);
        console.log('audioDeviceId', audioDeviceId);

        this.state = {
            cameraOn: videoDeviceId ? true : false,
            micOn: audioDeviceId ? true : false,
            displayOn: false
        };

        this.onTrack = this.onTrack.bind(this);
    }

    render() {
        return (
            <div className='media-control-bar'>
                <MediaToggleButton
                    kind={'camera'}
                    deviceId={this.props.videoDeviceId}
                    isOn={this.state.cameraOn}
                    onTrack={this.onTrack}
                    getMedia={getUserVideo}
                    icons={{on: 'videocam', off: 'videocam_off'}}
                />
                <MediaToggleButton
                    kind={'mic'}
                    deviceId={this.props.audioDeviceId}
                    isOn={this.state.micOn}
                    onTrack={this.onTrack}
                    getMedia={getUserAudio}
                    icons={{on: 'mic', off: 'mic_off'}}
                />
                <MediaToggleButton
                    kind={'display'}
                    deviceId={null}
                    isOn={this.state.displayOn}
                    onTrack={this.onTrack}
                    getMedia={getDisplayMedia}
                    icons={{on: 'screen_share', off: 'stop_screen_share'}}
                />
            </div>
        );
    }

    onTrack(kind, mediaTrack) {
        if (kind === 'camera') {
            this.setState(state => {
                return {
                    cameraOn: mediaTrack ? true : false,
                    displayOn: mediaTrack ? false : state.displayOn
                };
            });
            this.props.onVideoTrack(mediaTrack);
        } else if (kind === 'display') {
            this.setState(state => {
                return {
                    cameraOn: mediaTrack ? false : state.cameraOn,
                    displayOn: mediaTrack ? true : false
                };
            });
            this.props.onVideoTrack(mediaTrack);
        } else if (kind === 'mic') {
            this.setState({micOn: mediaTrack ? true : false});
            this.props.onAudioTrack(mediaTrack);
        }

    }
}

class MediaToggleButton extends Component {
    constructor(props) {
        super(props);
        this.mediaTrack = null;

        this.onClick = this.onClick.bind(this);
    }

    mediaIsOn() {
        return this.mediaTrack && this.mediaTrack.readyState === 'live';
    }

    render() {
        return (
            <button onClick={this.onClick}>
                <i className='material-icons'>
                    {this.props.isOn ? this.props.icons.on : this.props.icons.off}
                </i>
            </button>
        );
    }

    componentDidMount() {
        this.setMedia();
    }

    componentDidUpdate() {
        this.setMedia();
    }

    setMedia() {
        // Turn media on or off as specified by props
        if (this.props.isOn && !this.mediaIsOn()) {
            this.mediaOn();
        } else if (!this.props.isOn && this.mediaIsOn()) {
            this.mediaOff();
        }
    }

    onClick() {
        // Toggle media when the button is clicked
        if (this.props.isOn) {
            this.mediaOff();
        } else {
            this.mediaOn();
        }
    }

    mediaOn() {
        this.props.getMedia(this.props.deviceId).then((track) => {
            this.mediaTrack = track;
            this.props.onTrack(this.props.kind, track);
        });
    }

    mediaOff() {
        if (this.mediaIsOn()) {
            this.mediaTrack.stop();
        }
        this.props.onTrack(this.props.kind, null);
    }
}

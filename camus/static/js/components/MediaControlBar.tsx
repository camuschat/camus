import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setLocalAudio, setLocalVideo } from '../slices/feeds';
import { updateAudioDevice, updateVideoDevice, updateDisplayDevice } from '../slices/devices';
import { getUserVideo, getUserAudio, getDisplayMedia } from '../mediaUtils';
import ExitDialog from './ExitDialog';

class MediaControlBar extends Component {
    constructor(props) {
        super(props);
        this.onTrack = this.onTrack.bind(this);
    }

    render() {
        const {
            videoDevice,
            audioDevice,
            displayDevice
        } = this.props;

        const resolution = videoDevice.resolution;
        const videoConstraints = {
            deviceId: videoDevice.id,
            height: {ideal: resolution},
            width: {ideal: resolution * 4 / 3}
        };

        const audioConstraints = {
            deviceId: audioDevice.id
        };

        return (
            <section
                className='media-control-bar'
                aria-labelledby='media-controls-title'
            >
                <h1 id='media-controls-title' className='sr-only'>
                    Media controls
                </h1>
                <MediaToggleButton
                    kind={'camera'}
                    deviceConstraints={videoConstraints}
                    isOn={videoDevice.active}
                    onTrack={this.onTrack}
                    getMedia={getUserVideo}
                    icons={{on: 'videocam', off: 'videocam_off'}}
                    ariaLabel='Toggle enable camera'
                />
                <MediaToggleButton
                    kind={'mic'}
                    deviceConstraints={audioConstraints}
                    isOn={audioDevice.active}
                    onTrack={this.onTrack}
                    getMedia={getUserAudio}
                    icons={{on: 'mic', off: 'mic_off'}}
                    ariaLabel='Toggle enable microphone'
                />
                <MediaToggleButton
                    kind={'display'}
                    deviceConstraints={null}
                    isOn={displayDevice.active}
                    onTrack={this.onTrack}
                    getMedia={getDisplayMedia}
                    icons={{on: 'screen_share', off: 'stop_screen_share'}}
                    ariaLabel='Toggle enable desktop sharing'
                />
                <HangUpButton />
            </section>
        );
    }

    onTrack(kind, mediaTrack) {
        if (kind === 'camera') {
            this.props.setLocalVideo(mediaTrack);

            if (mediaTrack) {
                this.props.updateVideoDevice({active: true});
                this.props.updateDisplayDevice({active: false});
            } else {
                this.props.updateVideoDevice({active: false});
            }
        } else if (kind === 'display') {
            this.props.setLocalVideo(mediaTrack);

            if (mediaTrack) {
                this.props.updateDisplayDevice({active: true});
                this.props.updateVideoDevice({active: false});
            } else {
                this.props.updateDisplayDevice({active: false});
            }
        } else if (kind === 'mic') {
            this.props.setLocalAudio(mediaTrack);

            if (mediaTrack) {
                this.props.updateAudioDevice({active: true});
            } else {
                this.props.updateAudioDevice({active: false});
            }
        }

    }
}

MediaControlBar.propTypes = {
    audioDevice: PropTypes.object.isRequired,
    videoDevice: PropTypes.object.isRequired,
    displayDevice: PropTypes.object.isRequired,
    setLocalAudio: PropTypes.func.isRequired,
    setLocalVideo: PropTypes.func.isRequired,
    updateAudioDevice: PropTypes.func.isRequired,
    updateVideoDevice: PropTypes.func.isRequired,
    updateDisplayDevice: PropTypes.func.isRequired
};

function select(state) {
    const {
        devices
    } = state;

    return {
        audioDevice: devices.audio,
        videoDevice: devices.video,
        displayDevice: devices.display
    }
}

export default connect(
    select,
    {
        setLocalAudio,
        setLocalVideo,
        updateAudioDevice,
        updateVideoDevice,
        updateDisplayDevice
    }
)(MediaControlBar);

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
            <button onClick={this.onClick}
                aria-label={this.props.ariaLabel}
                aria-pressed={this.props.isOn}
            >
                <i className='material-icons'>
                    {this.props.isOn ? this.props.icons.on : this.props.icons.off}
                </i>
            </button>
        );
    }

    componentDidMount() {
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
        this.props.getMedia(this.props.deviceConstraints).then((track) => {
            this.mediaTrack = track;
            this.props.onTrack(this.props.kind, track);
        });
    }

    mediaOff() {
        if (this.mediaIsOn()) {
            this.mediaTrack.enabled = false;
            this.mediaTrack.stop();
        }
        this.props.onTrack(this.props.kind, null);
    }
}

MediaToggleButton.propTypes = {
    kind: PropTypes.string.isRequired,
    deviceConstraints: PropTypes.object,
    isOn: PropTypes.bool.isRequired,
    icons: PropTypes.object.isRequired,
    getMedia: PropTypes.func.isRequired,
    onTrack: PropTypes.func.isRequired,
    ariaLabel: PropTypes.string.isRequired
};

class HangUpButton extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showExitDialog: false,
        };

        this.onClick = this.onClick.bind(this);
        this.onCloseExitDialog = this.onCloseExitDialog.bind(this);
    }

    render() {
        return (<>
            { this.state.showExitDialog &&
            <ExitDialog onClose={this.onCloseExitDialog} />
            }
            <button onClick={this.onClick} aria-label='Hang up'>
                <i className='material-icons' style={{color: '#a00'}}>call_end</i>
            </button>
        </>);
    }

    onClick() {
        this.setState({
            showExitDialog: true
        });
    }

    onCloseExitDialog() {
        this.setState({
            showExitDialog: false
        });
    }
}

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {setLocalAudio, setLocalVideo} from '../slices/feeds';
import {updateAudioDevice, updateVideoDevice, updateDisplayDevice} from '../slices/devices';
import {getUserVideo, getUserAudio, getDisplayMedia} from '../mediaUtils.js';

class MediaControlBar extends Component {
    constructor(props) {
        super(props);

        const {
            videoDevice,
            audioDevice,
        } = this.props;

        this.state = {
            cameraOn: videoDevice.id ? true : false,
            micOn: audioDevice.id ? true : false,
            displayOn: false
        };

        this.onTrack = this.onTrack.bind(this);
    }

    render() {
        const {
            videoDevice,
            audioDevice
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
            <div className='media-control-bar'>
                <MediaToggleButton
                    kind={'camera'}
                    deviceConstraints={videoConstraints}
                    isOn={this.state.cameraOn}
                    onTrack={this.onTrack}
                    getMedia={getUserVideo}
                    icons={{on: 'videocam', off: 'videocam_off'}}
                />
                <MediaToggleButton
                    kind={'mic'}
                    deviceConstraints={audioConstraints}
                    isOn={this.state.micOn}
                    onTrack={this.onTrack}
                    getMedia={getUserAudio}
                    icons={{on: 'mic', off: 'mic_off'}}
                />
                <MediaToggleButton
                    kind={'display'}
                    deviceConstraints={null}
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

            this.props.setLocalVideo(mediaTrack);

            if (mediaTrack) {
                this.props.updateVideoDevice({active: true});
                this.props.updateDisplayDevice({active: false});
            } else {
                this.props.updateVideoDevice({active: false});
            }
        } else if (kind === 'display') {
            this.setState(state => {
                return {
                    cameraOn: mediaTrack ? false : state.cameraOn,
                    displayOn: mediaTrack ? true : false
                };
            });

            this.props.setLocalVideo(mediaTrack);

            if (mediaTrack) {
                this.props.updateDisplayDevice({active: true});
                this.props.updateVideoDevice({active: false});
            } else {
                this.props.updateDisplayDevice({active: false});
            }
        } else if (kind === 'mic') {
            this.setState({micOn: mediaTrack ? true : false});
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
        devices,
    } = state;

    return {
        audioDevice: devices.audio,
        videoDevice: devices.video,
        displayDevice: devices.display,
    }
}

export default connect(
    select,
    {setLocalAudio, setLocalVideo, updateAudioDevice, updateVideoDevice, updateDisplayDevice}
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
        this.props.getMedia(this.props.deviceConstraints).then((track) => {
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

MediaToggleButton.propTypes = {
    kind: PropTypes.string.isRequired,
    deviceConstraints: PropTypes.object,
    isOn: PropTypes.bool.isRequired,
    icons: PropTypes.object.isRequired,
    getMedia: PropTypes.func.isRequired,
    onTrack: PropTypes.func.isRequired
};

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {updateFeed, setLocalAudio, setLocalVideo} from '../slices/feeds';
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
            audioDevice,
            localFeed
        } = this.props;

        const resolution = Math.min(videoDevice.maxResolution, localFeed.resolution);
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
            const maxResolution = this.props.videoDevice.maxResolution;
            console.log('MAX RES: ', maxResolution);
            this.setState(state => {
                return {
                    cameraOn: mediaTrack ? true : false,
                    displayOn: mediaTrack ? false : state.displayOn
                };
            });

            if (mediaTrack) {
                this.props.updateFeed({
                    id: 'local',
                    maxResolution
                });
            }

            this.props.setLocalVideo(mediaTrack);
        } else if (kind === 'display') {
            this.setState(state => {
                return {
                    cameraOn: mediaTrack ? false : state.cameraOn,
                    displayOn: mediaTrack ? true : false
                };
            });

            if (mediaTrack) {
                this.props.updateFeed({
                    id: 'local',
                    maxResolution: mediaTrack.getSettings().height
                });
            }

            this.props.setLocalVideo(mediaTrack);
        } else if (kind === 'mic') {
            this.setState({micOn: mediaTrack ? true : false});
            this.props.setLocalAudio(mediaTrack);
        }

    }
}

MediaControlBar.propTypes = {
    audioDevice: PropTypes.object.isRequired,
    videoDevice: PropTypes.object.isRequired,
    displayDevice: PropTypes.object.isRequired,
    localFeed: PropTypes.object.isRequired,
    updateFeed: PropTypes.func.isRequired,
    setLocalAudio: PropTypes.func.isRequired,
    setLocalVideo: PropTypes.func.isRequired
};

function select(state) {
    const {
        devices,
        feeds
    } = state;

    const localFeed = feeds.find(feed => feed.id === 'local');

    return {
        audioDevice: devices.audio,
        videoDevice: devices.video,
        displayDevice: devices.display,
        localFeed
    }
}

export default connect(
    select,
    {updateFeed, setLocalAudio, setLocalVideo}
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

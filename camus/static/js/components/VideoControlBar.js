import React, {Component} from 'react';
import PropTypes from 'prop-types';
import fscreen from 'fscreen';
import {connect} from 'react-redux';
import {setResolution} from '../slices/devices';
import {disableRemoteVideo, enableRemoteVideo} from '../slices/feeds';
import {RESOLUTIONS} from '../mediaUtils.js';

class VideoControlBar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            volume: 1.0,
            volumeMuted: false,
            showSettings: false
        }

        this.toggleAudioMute = this.toggleAudioMute.bind(this);
        this.handleVolumeChange = this.handleVolumeChange.bind(this);
        this.toggleSettings = this.toggleSettings.bind(this);
        this.togglePictureInPicture = this.togglePictureInPicture.bind(this);
        this.toggleFullscreen = this.toggleFullscreen.bind(this);
        this.toggleVisibility = this.toggleVisibility.bind(this);
    }

    render() {
        const {
            volume,
            volumeMuted,
            showSettings
        } = this.state;

        const {
            videoRef,
            feed,
            showVisibilityControls,
            showAudioControls,
            showResolutionControls,
            videoDevice
        } = this.props;

        const volumeIcon = (
            volumeMuted || volume == 0 ?  'volume_off' :
            volume < 0.6 ?  'volume_down' : 'volume_up'
        );

        // We should only render the picture-in-picture and fullscreen toggle
        // buttons if the browser supports these features
        const video = videoRef.current;
        const pipSupported = ('pictureInPictureEnabled' in document ||
            video && video.webkitSetPresentationMode);

        return (
            <div className='video-control-bar'>
                {showVisibilityControls &&
                <button className='toggle-visibility' onClick={this.toggleVisibility}>
                    <i className='material-icons'>{feed.videoEnabled ? 'visibility' : 'visibility_off'}</i>
                </button>
                }
                {showAudioControls && <>
                <button className='toggle-audio' onClick={this.toggleAudioMute}>
                    <i className='material-icons'>{volumeIcon}</i>
                </button>
                <input
                    className='volume-slider'
                    type='range'
                    min='0' max='1' step='0.1'
                    value={volumeMuted ? 0 : volume}
                    onChange={this.handleVolumeChange}
                />
                </>}
                {showResolutionControls && videoDevice.active &&
                <button className='toggle-settings' onClick={this.toggleSettings}>
                    <i className='material-icons'>settings</i>
                </button>
                }
                {showResolutionControls && videoDevice.active &&
                    showSettings && this.renderSettings()}
                {pipSupported &&
                <button className='toggle-pip' onClick={this.togglePictureInPicture}>
                    <i className='material-icons'>picture_in_picture</i>
                </button>
                }
                {fscreen.fullscreenEnabled &&
                <button className='toggle-fullscreen' onClick={this.toggleFullscreen}>
                    <i className='material-icons'>fullscreen</i>
                </button>
                }
            </div>
        );
    }

    renderSettings() {
        const videoDevice = this.props.videoDevice;
        const selectedResolution = `${videoDevice.resolution}p`;

        const options = RESOLUTIONS.filter(res =>
            res <= videoDevice.maxResolution
        ).map(res => 
            `${res}p`
        );

        return (
            <div className='video-settings'>
                <p>Video quality</p>
                {options.map(option =>
                    <button key={option} onClick={() => this.setQuality(option)}>
                        <span className={option === selectedResolution ? 'selected' : ''}>
                            {option}
                        </span>
                    </button>
                )}
            </div>
        );
    }

    componentDidUpdate() {
        const audio = this.props.audioRef.current;
        audio.muted = this.state.volumeMuted;
        audio.volume = this.state.volume;
    }

    toggleAudioMute() {
        this.setState(state  => {
            const volumeMuted = !state.volumeMuted;
            return { volumeMuted };
        });
    }

    handleVolumeChange(event) {
        const volume = event.target.value;
        const volumeMuted = false;
        this.setState({ volume, volumeMuted });
    }

    toggleSettings() {
        this.setState(state => {
            const showSettings = !state.showSettings;
            return { showSettings };
        });
    }

    setQuality(value) {
        const resolution = Number(value.replace(/p/, ''));
        this.props.setResolution(resolution);
        this.setState({ showSettings: false });
    }

    togglePictureInPicture() {
        const video = this.props.videoRef.current;

        if (video && video.webkitSetPresentationMode) {
            video.webkitSetPresentationMode(
                video.webkitPresentationMode === "picture-in-picture"
                ? "inline"
                : "picture-in-picture"
            );
        } else if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(err => {
                console.error(err);
            });
        } else {
            video.requestPictureInPicture().catch(err => {
                console.error(err);
            });
        }
    }

    toggleFullscreen() {
        const videoContainer = this.props.videoContainerRef.current;

        if (fscreen.fullscreenElement) {
            fscreen.exitFullscreen();
        } else {
            fscreen.requestFullscreen(videoContainer);
        }
    }

    toggleVisibility() {
        const feed = this.props.feed;
        if (feed.videoEnabled) {
            this.props.disableRemoteVideo(feed.id);
        } else {
            this.props.enableRemoteVideo(feed.id);
        }
    }
}

VideoControlBar.propTypes = {
    audioRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
    videoRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
    videoContainerRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
    feed: PropTypes.object.isRequired,
    showVisibilityControls: PropTypes.bool.isRequired,
    showAudioControls: PropTypes.bool.isRequired,
    showResolutionControls: PropTypes.bool.isRequired,
    videoDevice: PropTypes.object.isRequired,
    disableRemoteVideo: PropTypes.func.isRequired,
    enableRemoteVideo: PropTypes.func.isRequired,
    setResolution: PropTypes.func.isRequired
};

function select(state) {
    const {
        devices,
    } = state;

    return {
        videoDevice: devices.video,
    }
}

export default connect(
    select,
    {
        setResolution,
        disableRemoteVideo,
        enableRemoteVideo
    },
)(VideoControlBar);

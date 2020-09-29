import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {setResolution} from '../slices/feeds';
import fscreen from 'fscreen';

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
    }

    render() {
        const {
            volume,
            volumeMuted,
            showSettings
        } = this.state;

        const volumeIcon = (
            volumeMuted || volume == 0 ?  'volume_off' :
            volume < 0.6 ?  'volume_down' : 'volume_up'
        );

        // We should only render the picture-in-picture and fullscreen toggle
        // buttons if the browser supports these features
        const video = this.props.videoRef.current;
        const pipSupported = ('pictureInPictureEnabled' in document ||
            video && video.webkitSetPresentationMode);

        return (
            <div className='video-control-bar'>
                <button>
                    <i className='material-icons'>visibility</i>
                </button>
                {this.props.showAudioControls && <>
                <button onClick={this.toggleAudioMute}>
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
                <button onClick={this.toggleSettings}>
                    <i className='material-icons'>settings</i>
                </button>
                {showSettings && this.renderSettings()}
                {pipSupported &&
                <button onClick={this.togglePictureInPicture}>
                    <i className='material-icons'>picture_in_picture</i>
                </button>
                }
                {fscreen.fullscreenEnabled &&
                <button onClick={this.toggleFullscreen}>
                    <i className='material-icons'>fullscreen</i>
                </button>
                }
            </div>
        );
    }

    renderSettings() {
        const options = RESOLUTIONS.filter(res =>
            res <= this.props.feed.maxResolution
        ).map(res => 
            `${res}p`
        );

        //const options = ['720p', '480p', '360p', '240p']
        return (
            <div className='video-settings'>
                <p>Video quality</p>
                {options.map(option =>
                    <button key={option} onClick={() => this.setQuality(option)}>
                        {option}
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
        const updatedFeed = {
            id: this.props.feed.id,
            resolution
        };
        this.props.setResolution(updatedFeed);
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
}

VideoControlBar.propTypes = {
    audioRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
    videoRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
    videoContainerRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
    feed: PropTypes.object.isRequired,
    showAudioControls: PropTypes.bool,
    setResolution: PropTypes.func.isRequired
};

export default connect(
    null,
    {setResolution},
)(VideoControlBar);

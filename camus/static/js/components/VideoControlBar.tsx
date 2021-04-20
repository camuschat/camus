import React, { Component } from 'react';
import fscreen from 'fscreen';
import { connect, ConnectedProps } from 'react-redux';
import { setResolution } from '../slices/devices';
import { disableRemoteVideo, enableRemoteVideo, Feed } from '../slices/feeds';
import { RESOLUTIONS } from '../mediaUtils';
import { RootState } from '../store';

interface VideoControlBarProps extends PropsFromRedux {
    audioRef: React.RefObject<HTMLAudioElement>;
    videoRef: React.RefObject<HTMLVideoElement>;
    videoContainerRef: React.RefObject<HTMLDivElement>;
    feed: Feed & { username: string };
    showVisibilityControls: boolean;
    showAudioControls: boolean;
    showResolutionControls: boolean;
}

interface VideoControlBarState {
    volume: number;
    volumeMuted: boolean;
    showSettings: boolean;
}

class VideoControlBar extends Component<
    VideoControlBarProps,
    VideoControlBarState
> {
    constructor(props: VideoControlBarProps) {
        super(props);

        this.state = {
            volume: 1.0,
            volumeMuted: false,
            showSettings: false,
        };

        this.toggleAudioMute = this.toggleAudioMute.bind(this);
        this.handleVolumeChange = this.handleVolumeChange.bind(this);
        this.toggleSettings = this.toggleSettings.bind(this);
        this.togglePictureInPicture = this.togglePictureInPicture.bind(this);
        this.toggleFullscreen = this.toggleFullscreen.bind(this);
        this.toggleVisibility = this.toggleVisibility.bind(this);
    }

    render(): React.ReactNode {
        const { volume, volumeMuted, showSettings } = this.state;

        const {
            videoRef,
            feed,
            showVisibilityControls,
            showAudioControls,
            showResolutionControls,
            videoDevice,
        } = this.props;

        const volumeIcon =
            volumeMuted || volume == 0
                ? 'volume_off'
                : volume < 0.6
                ? 'volume_down'
                : 'volume_up';

        // We should only render the picture-in-picture and fullscreen toggle
        // buttons if the browser supports these features
        const video = videoRef.current;
        const pipSupported =
            'pictureInPictureEnabled' in document ||
            (video && 'webkitSetPresentationMode' in video);

        return (
            <div className='video-control-bar'>
                {showVisibilityControls && (
                    <button
                        className='toggle-visibility'
                        onClick={this.toggleVisibility}
                        aria-label={`Toggle mute video for feed ${feed.username}`}
                        aria-pressed={!feed.videoEnabled}
                    >
                        <i className='material-icons'>
                            {feed.videoEnabled
                                ? 'visibility'
                                : 'visibility_off'}
                        </i>
                    </button>
                )}
                {showAudioControls && (
                    <>
                        <button
                            className='toggle-audio'
                            onClick={this.toggleAudioMute}
                            aria-label={`Toggle mute audio for feed ${feed.username}`}
                            aria-pressed={this.state.volumeMuted}
                        >
                            <i className='material-icons'>{volumeIcon}</i>
                        </button>
                        <input
                            className='volume-slider'
                            type='range'
                            min='0'
                            max='1'
                            step='0.1'
                            value={volumeMuted ? 0 : volume}
                            onChange={this.handleVolumeChange}
                            aria-label={`Audio volume slider for feed ${feed.username}`}
                        />
                    </>
                )}
                {showResolutionControls && videoDevice.active && (
                    <button
                        className='toggle-settings'
                        onClick={this.toggleSettings}
                        aria-label='Toggle video settings menu for your camera'
                    >
                        <i className='material-icons'>settings</i>
                    </button>
                )}
                {showResolutionControls &&
                    videoDevice.active &&
                    showSettings &&
                    this.renderSettings()}
                {pipSupported && (
                    <button
                        className='toggle-pip'
                        onClick={this.togglePictureInPicture}
                        aria-label={`Toggle picture-in-picture video for feed ${feed.username}`}
                    >
                        <i className='material-icons'>picture_in_picture</i>
                    </button>
                )}
                {fscreen.fullscreenEnabled && (
                    <button
                        className='toggle-fullscreen'
                        onClick={this.toggleFullscreen}
                        aria-label={`Toggle fullscreen video for feed ${feed.username}`}
                    >
                        <i className='material-icons'>fullscreen</i>
                    </button>
                )}
            </div>
        );
    }

    renderSettings(): React.ReactNode {
        const videoDevice = this.props.videoDevice;
        const selectedResolution = `${videoDevice.resolution}p`;

        const options = RESOLUTIONS.filter(
            (res) => res <= videoDevice.maxResolution
        ).map((res) => `${res}p`);

        return (
            <div className='video-settings'>
                <p>Video quality</p>
                {options.map((option) => (
                    <button
                        key={option}
                        onClick={() => this.setQuality(option)}
                    >
                        <span
                            className={
                                option === selectedResolution ? 'selected' : ''
                            }
                        >
                            {option}
                        </span>
                    </button>
                ))}
            </div>
        );
    }

    componentDidUpdate(): void {
        const audio = this.props.audioRef.current;
        if (audio) {
            audio.muted = this.state.volumeMuted;
            audio.volume = this.state.volume;
        }
    }

    toggleAudioMute(): void {
        this.setState((state) => {
            const volumeMuted = !state.volumeMuted;
            return { volumeMuted };
        });
    }

    handleVolumeChange(event: React.ChangeEvent<HTMLInputElement>): void {
        const volume = Number(event.target.value);
        const volumeMuted = false;
        this.setState({ volume, volumeMuted });
    }

    toggleSettings(): void {
        this.setState((state) => {
            const showSettings = !state.showSettings;
            return { showSettings };
        });
    }

    setQuality(value: string): void {
        const resolution = Number(value.replace(/p/, ''));
        this.props.setResolution(resolution);
        this.setState({ showSettings: false });
    }

    togglePictureInPicture(): void {
        const video = this.props.videoRef.current;

        if (video && 'webkitSetPresentationMode' in video) {
            (video as any).webkitSetPresentationMode(
                (video as any).webkitPresentationMode === 'picture-in-picture'
                    ? 'inline'
                    : 'picture-in-picture'
            );
        } else if ((document as any).pictureInPictureElement) {
            (document as any).exitPictureInPicture().catch((error: any) => {
                console.error(error);
            });
        } else if (video) {
            (video as any).requestPictureInPicture().catch((error: any) => {
                console.error(error);
            });
        }
    }

    toggleFullscreen(): void {
        const videoContainer = this.props.videoContainerRef.current;

        if (fscreen.fullscreenElement) {
            fscreen.exitFullscreen();
        } else if (videoContainer) {
            fscreen.requestFullscreen(videoContainer);
        }
    }

    toggleVisibility(): void {
        const feed = this.props.feed;
        if (feed.videoEnabled) {
            this.props.disableRemoteVideo(feed.id);
        } else {
            this.props.enableRemoteVideo(feed.id);
        }
    }
}

// Connect VideoControlBar to Redux
const mapState = (state: RootState) => ({
    videoDevice: state.devices.video,
});

const mapDispatch = {
    setResolution,
    disableRemoteVideo,
    enableRemoteVideo,
};

const connector = connect(mapState, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(VideoControlBar);

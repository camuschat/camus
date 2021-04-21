import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { setLocalAudio, setLocalVideo } from '../slices/feeds';
import {
    updateAudioDevice,
    updateVideoDevice,
    updateDisplayDevice,
} from '../slices/devices';
import { getUserVideo, getUserAudio, getDisplayMedia } from '../mediaUtils';
import ExitDialog from './ExitDialog';
import { RootState } from '../store';

class MediaControlBar extends Component<PropsFromRedux> {
    constructor(props: PropsFromRedux) {
        super(props);
        this.onTrack = this.onTrack.bind(this);
    }

    render(): React.ReactNode {
        const { videoDevice, audioDevice, displayDevice } = this.props;

        const resolution = videoDevice.resolution;
        const videoConstraints = {
            deviceId: videoDevice.id,
            height: { ideal: resolution },
            width: { ideal: (resolution * 4) / 3 },
        };

        const audioConstraints = {
            deviceId: audioDevice.id,
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
                    icons={{ on: 'videocam', off: 'videocam_off' }}
                    ariaLabel='Toggle enable camera'
                />
                <MediaToggleButton
                    kind={'mic'}
                    deviceConstraints={audioConstraints}
                    isOn={audioDevice.active}
                    onTrack={this.onTrack}
                    getMedia={getUserAudio}
                    icons={{ on: 'mic', off: 'mic_off' }}
                    ariaLabel='Toggle enable microphone'
                />
                <MediaToggleButton
                    kind={'display'}
                    deviceConstraints={null}
                    isOn={displayDevice.active}
                    onTrack={this.onTrack}
                    getMedia={getDisplayMedia}
                    icons={{ on: 'screen_share', off: 'stop_screen_share' }}
                    ariaLabel='Toggle enable desktop sharing'
                />
                <HangUpButton />
            </section>
        );
    }

    onTrack(kind: string, mediaTrack: MediaStreamTrack): void {
        if (kind === 'camera') {
            this.props.setLocalVideo(mediaTrack);

            if (mediaTrack) {
                this.props.updateVideoDevice({ active: true });
                this.props.updateDisplayDevice({ active: false });
            } else {
                this.props.updateVideoDevice({ active: false });
            }
        } else if (kind === 'display') {
            this.props.setLocalVideo(mediaTrack);

            if (mediaTrack) {
                this.props.updateDisplayDevice({ active: true });
                this.props.updateVideoDevice({ active: false });
            } else {
                this.props.updateDisplayDevice({ active: false });
            }
        } else if (kind === 'mic') {
            this.props.setLocalAudio(mediaTrack);

            if (mediaTrack) {
                this.props.updateAudioDevice({ active: true });
            } else {
                this.props.updateAudioDevice({ active: false });
            }
        }
    }
}

// Connect MediaControlBar to Redux
const mapState = (state: RootState) => ({
    audioDevice: state.devices.audio,
    videoDevice: state.devices.video,
    displayDevice: state.devices.display,
});

const mapDispatch = {
    setLocalAudio,
    setLocalVideo,
    updateAudioDevice,
    updateVideoDevice,
    updateDisplayDevice,
};

const connector = connect(mapState, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(MediaControlBar);

interface MediaToggleButtonProps {
    kind: string;
    deviceConstraints: object | null;
    isOn: boolean;
    icons: { on: string; off: string };
    getMedia: Function;
    onTrack: Function;
    ariaLabel: string;
}

class MediaToggleButton extends Component<MediaToggleButtonProps> {
    private mediaTrack: MediaStreamTrack | null;

    constructor(props: MediaToggleButtonProps) {
        super(props);
        this.mediaTrack = null;

        this.onClick = this.onClick.bind(this);
    }

    mediaIsOn(): boolean {
        return Boolean(
            this.mediaTrack && this.mediaTrack.readyState === 'live'
        );
    }

    render(): React.ReactNode {
        return (
            <button
                onClick={this.onClick}
                aria-label={this.props.ariaLabel}
                aria-pressed={this.props.isOn}
            >
                <i className='material-icons'>
                    {this.props.isOn
                        ? this.props.icons.on
                        : this.props.icons.off}
                </i>
            </button>
        );
    }

    componentDidMount(): void {
        this.setMedia();
    }

    setMedia(): void {
        // Turn media on or off as specified by props
        if (this.props.isOn && !this.mediaIsOn()) {
            this.mediaOn();
        } else if (!this.props.isOn && this.mediaIsOn()) {
            this.mediaOff();
        }
    }

    onClick(): void {
        // Toggle media when the button is clicked
        if (this.props.isOn) {
            this.mediaOff();
        } else {
            this.mediaOn();
        }
    }

    mediaOn(): void {
        this.props
            .getMedia(this.props.deviceConstraints)
            .then((track: MediaStreamTrack) => {
                this.mediaTrack = track;
                this.props.onTrack(this.props.kind, track);
            });
    }

    mediaOff(): void {
        if (this.mediaTrack && this.mediaIsOn()) {
            this.mediaTrack.enabled = false;
            this.mediaTrack.stop();
        }
        this.props.onTrack(this.props.kind, null);
    }
}

interface HangUpButtonProps {}

interface HangUpButtonState {
    showExitDialog: boolean;
}

class HangUpButton extends Component<HangUpButtonProps, HangUpButtonState> {
    constructor(props: HangUpButtonProps) {
        super(props);

        this.state = {
            showExitDialog: false,
        };

        this.onClick = this.onClick.bind(this);
        this.onCloseExitDialog = this.onCloseExitDialog.bind(this);
    }

    render(): React.ReactNode {
        return (
            <>
                {this.state.showExitDialog && (
                    <ExitDialog onClose={this.onCloseExitDialog} />
                )}
                <button onClick={this.onClick} aria-label='Hang up'>
                    <i className='material-icons' style={{ color: '#a00' }}>
                        call_end
                    </i>
                </button>
            </>
        );
    }

    onClick(): void {
        this.setState({
            showExitDialog: true,
        });
    }

    onCloseExitDialog(): void {
        this.setState({
            showExitDialog: false,
        });
    }
}

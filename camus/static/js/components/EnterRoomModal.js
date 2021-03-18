import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { setUsername } from '../slices/users';
import { updateAudioDevice, updateVideoDevice } from '../slices/devices';
import { getCameras, getMics, getUserMedia, getUserVideo } from '../mediaUtils';

class EnterRoomModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nickname: '',
            audioDeviceId: '',
            videoDeviceId: '',
            mics: [],
            cameras: []
        };

        this.videoPreview = React.createRef();

        this.onSelectDevice = this.onSelectDevice.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    render() {
        if (!this.props.isVisible) {
            return null;
        }

        return (<>
            <div className='modal-overlay'></div>
            <div className='enter-room-modal dialog fade-in'>
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Nickname
                        <input
                            type='text'
                            name='nickname'
                            value={this.state.nickname}
                            onChange={this.handleChange}
                            required
                        />
                    </label>
                    <DeviceSelect
                        label='Microphone'
                        devices={this.state.mics}
                        onSelectDevice={this.onSelectDevice}
                    />
                    <DeviceSelect
                        label='Camera'
                        devices={this.state.cameras}
                        onSelectDevice={this.onSelectDevice}
                    />
                    <input type='submit' value='Enter room' />
                </form>
                <div className='video-container'>
                    <video
                        ref={this.videoPreview}
                        autoPlay={true}
                        playsInline={true}
                    />
                </div>
            </div>
        </>);
    }

    componentDidMount() {
        // Prompt the user for camera/microphone permission, then get a list of
        // available microphones and cameras
        getUserMedia().then(({audio, video}) => {
            if (audio) audio.stop();
            if (video) video.stop();
        }).then(() => {
            return Promise.all([
                getMics(),
                getCameras()
            ]);
        }).then(([mics, cameras]) => {
            this.setState({
                mics,
                cameras
            });
        });
    }

    componentWillUnmount() {
        this.stopPreviewStream();
    }

    onSelectDevice(kind, deviceId) {
        if (kind === 'Camera') {
            this.stopPreviewStream();

            if (deviceId) {
                // Determine the maximum camera resolution, then set the
                // preview stream
                this.getMaxCameraResolution(deviceId).then(maxResolution => {
                    this.props.updateVideoDevice({
                        maxResolution
                    });
                }).then(() => {
                    return getUserVideo({deviceId});
                }).then(track => {
                    const stream = new MediaStream([track]);
                    this.videoPreview.current.srcObject = stream;
                });
            }

            this.props.updateVideoDevice({
                id: deviceId
            });

            this.setState({
                videoDeviceId: deviceId
            });
        } else if (kind === 'Microphone') {
            this.setState({
                audioDeviceId: deviceId
            });
        }
    }

    handleChange(event) {
        const nickname = event.target.value;
        this.setState({
            nickname: nickname
        });
    }

    handleSubmit() {
        event.preventDefault();

        const {
            nickname,
            audioDeviceId,
            videoDeviceId
        } = this.state;

        // If no camera was selected, determine the maximum resolution of the
        // default camera
        if (!videoDeviceId) {
            this.getMaxCameraResolution(videoDeviceId).then(maxResolution => {
                this.props.updateVideoDevice({
                    maxResolution
                });
            });
        }

        this.props.setUsername(nickname);
        this.props.updateVideoDevice({
            id: videoDeviceId,
            active: videoDeviceId ? true : false
        });
        this.props.updateAudioDevice({
            id: audioDeviceId,
            active: audioDeviceId ? true : false
        });
        this.props.onSubmit();
    }

    getMaxCameraResolution(deviceId) {
        // Determine the maximum camera resolution.
        // Note that we must stop the preview stream to turn off the camera
        // since the camera probably only supports a single resolution at
        // a time.
        this.stopPreviewStream();
        const videoConstraints = {
            deviceId,
            height: {ideal: 2160}
        };

        return getUserVideo(videoConstraints).then(track => {
            const resolution = track.getSettings().height;
            track.stop();
            return resolution;
        });
    }

    stopPreviewStream() {
        const stream = this.videoPreview.current.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        this.videoPreview.current.srcObject = null;
    }
}

EnterRoomModal.propTypes = {
    isVisible: PropTypes.bool.isRequired,
    setUsername: PropTypes.func.isRequired,
    updateAudioDevice: PropTypes.func.isRequired,
    updateVideoDevice: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default connect(
    null,
    {
        setUsername,
        updateAudioDevice,
        updateVideoDevice
    }
)(EnterRoomModal);

class DeviceSelect extends Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    render() {
        return (
            <label>
                {this.props.label}
                <select name={this.props.label} onChange={this.handleChange}>
                    <option value=''>None</option>
                    {this.props.devices.map(device =>
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label}
                        </option>
                    )}
                </select>
            </label>
        );
    }

    handleChange(event) {
        const deviceId = event.target.value;
        this.props.onSelectDevice(this.props.label, deviceId);
    }
}

DeviceSelect.propTypes = {
    label: PropTypes.string.isRequired,
    devices: PropTypes.array.isRequired,
    onSelectDevice: PropTypes.func.isRequired
};

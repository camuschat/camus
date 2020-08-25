import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {getCameras, getMics, getUserVideo} from '../mediaUtils.js';

export default class EnterRoomModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nickname: '',
            audioDeviceId: '',
            videoDeviceId: ''
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
            <div className='enter-room-modal'>
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
                        getDevices={getMics}
                        onSelectDevice={this.onSelectDevice}
                    />
                    <DeviceSelect
                        label='Camera'
                        getDevices={getCameras}
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

    componentWillUnmount() {
        this.stopPreviewStream();
    }

    onSelectDevice(kind, deviceId) {
        if (kind === 'Camera') {
            this.stopPreviewStream();

            if (deviceId) {
                getUserVideo(deviceId).then(track => {
                    const stream = new MediaStream([track]);
                    this.videoPreview.current.srcObject = stream;
                });
            } else {
                this.videoPreview.current.srcObject = null;
            }

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
        this.props.onSubmit(nickname, audioDeviceId, videoDeviceId);
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
    onSubmit: PropTypes.func.isRequired
};

class DeviceSelect extends Component {
    constructor(props) {
        super(props);

        this.state = {
            devices: []
        };

        this.handleChange = this.handleChange.bind(this);
    }

    render() {
        return (
            <label>
                {this.props.label}
                <select name={this.props.label} onChange={this.handleChange}>
                    <option value=''>None</option>
                    {this.state.devices.map(device =>
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label}
                        </option>
                    )}
                </select>
            </label>
        );
    }

    componentDidMount() {
        this.props.getDevices().then(devices => {
            this.setState({
                devices: devices
            });
        });
    }

    handleChange(event) {
        const deviceId = event.target.value;
        this.props.onSelectDevice(this.props.label, deviceId);
    }
}

DeviceSelect.propTypes = {
    label: PropTypes.string.isRequired,
    getDevices: PropTypes.func.isRequired,
    onSelectDevice: PropTypes.func.isRequired
};

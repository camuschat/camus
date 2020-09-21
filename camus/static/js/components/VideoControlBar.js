import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class VideoControlBar extends Component {
    constructor(props) {
        super(props);

        this.togglePictureInPicture = this.togglePictureInPicture.bind(this);
    }

    render() {
        // We should only render the picture-in-picture toggle button if the
        // browser supports picture-in-picture
        const video = this.props.videoRef.current;
        const pipSupported = ('pictureInPictureEnabled' in document ||
            video &&video.webkitSetPresentationMode);

        return (
            <div className='video-control-bar'>
                {pipSupported &&
                <button onClick={this.togglePictureInPicture}>
                    <i className='material-icons'>picture_in_picture</i>
                </button>
                }
                <button>
                    <i className='material-icons'>fullscreen</i>
                </button>
            </div>
        );
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
}

VideoControlBar.propTypes = {
    videoRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired
};

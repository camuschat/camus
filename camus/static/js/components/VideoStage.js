import React, {Component} from 'react';
import PropTypes from 'prop-types';

export default class VideoStage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            videoHeightAspect: 3,
            videoWidthAspect: 4,
            videoScaleFactor: 1.0
        };

        this.updateScaleFactor = this.updateScaleFactor.bind(this);
    }

    render() {
        // Associate each feed with the corresponding username
        const feeds = this.props.feeds;
        const users = this.props.users;
        feeds.forEach(feed => {
            const user = users.find(user => user.id === feed.id);
            feed.username = user ? user.username : 'Major Tom';
        });

        const feedHeight = Math.floor(this.state.videoScaleFactor * this.state.videoHeightAspect);
        const feedWidth = Math.floor(this.state.videoScaleFactor * this.state.videoWidthAspect);
        const videoFeedStyle = {
            height: `${feedHeight}px`,
            width: `${feedWidth}px`,
        };

        return (
            <ul id='video-stage' className='video-stage'>
                {this.props.feeds.map((feed) =>
                    <VideoFeed
                        key={feed.id}
                        feed={feed}
                        style={videoFeedStyle}
                        onDragAndDrop={this.props.onSwapFeeds}
                    />
                )}
            </ul>
        );
    }

    componentDidMount() {
        // Dynamically update the size of displayed video feeds when the
        // window is resized
        window.addEventListener('resize', this.updateScaleFactor)
        this.updateScaleFactor();
    }

    componentDidUpdate() {
        const videoScaleFactor = this.calculateScaleFactor(
            this.props.feeds.length, this.state.videoHeightAspect, this.state.videoWidthAspect);

        if (videoScaleFactor !== this.state.videoScaleFactor) {
            this.updateScaleFactor(videoScaleFactor);
        }
    }

    updateScaleFactor(scaleFactor=null) {
        this.setState((state, props)  => {
            const videoScaleFactor = (scaleFactor ?
                scaleFactor :
                this.calculateScaleFactor(props.feeds.length, state.videoHeightAspect,
                                            state.videoWidthAspect)
            );


            return {
                videoScaleFactor: videoScaleFactor
            };
        });
    }

    calculateScaleFactor(nItems, heightAspect, widthAspect, minWidth=0) {
        const container = document.querySelector('#video-stage');

        // "Normalize" the height and width of the container relative to the
        // aspect ratio of the contained items
        const normHeight = container.clientHeight / heightAspect;
        const normWidth = container.clientWidth / widthAspect;

        // The ratio of columns to rows should approximately match the 
        // normalized aspect ratio of the container
        let rows = (Math.sqrt(nItems * (normHeight / normWidth)));
        let columns = (Math.sqrt(nItems * (normWidth / normHeight)));

        // The product of rows and columns should be minimized such that it still
        // fits all the items
        const rowsFloor = Math.floor(rows);
        const rowsCeiling = Math.ceil(rows);
        const columnsFloor = Math.floor(columns);
        const columnsCeiling = Math.ceil(columns);
        const gridOptions = [
            [rowsFloor, columnsFloor],
            [rowsCeiling, columnsFloor],
            [rowsFloor, columnsCeiling],
            [rowsCeiling, columnsCeiling]
        ].filter(([rows, columns]) => rows * columns >= nItems);

        // Compute the maximum scaling factor based on the remaining grid options
        const scaleFactors = gridOptions.map(([rows, columns]) => {
            // The -2 provides a small amount of slack to account for numerical
            // imprecision. Without this slack, occasionally the items are slightly
            // too wide and pushed into a new row, causing overflow.
            const xScale = (container.clientWidth - 2) / (columns * widthAspect);
            const yScale = (container.clientHeight - 2) / (rows * heightAspect);
            return Math.min(xScale, yScale);
        });
        let scale = Math.max(...scaleFactors);

        // If the computed scaling factor would cause the width of an item to
        // be less than the specified minimum, recompute the scaling factor to
        // conform to the minimum
        if (scale * widthAspect < minWidth) {
            scale = minWidth / widthAspect;
        }

        return scale;
    }
}

VideoStage.propTypes = {
    feeds: PropTypes.array.isRequired,
    users: PropTypes.array.isRequired,
    onSwapFeeds: PropTypes.func.isRequired
};

class VideoFeed extends Component {
    constructor(props) {
        super(props);

        // Create a ref for the <video> element so that we can act on the DOM
        // directly to update the stream source
        this.video = React.createRef();

        this.onDragStart = this.onDragStart.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDrop = this.onDrop.bind(this);
    }

    render() {
        return (
            <li className='video-feed'
                style={this.props.style}
                draggable={'true'}
                onDragStart={this.onDragStart}
                onDragOver={this.onDragOver}
                onDrop={this.onDrop}
            >
                <p className='video-tag'>{this.props.feed.username}</p>
                <video
                    ref={this.video}
                    id={this.props.feed.id}
                    autoPlay={true}
                    playsInline={true}
                />
            </li>
        );
    }

    componentDidMount() {
        this.video.current.srcObject = this.props.feed.stream;
    }

    componentDidUpdate() {
        if (this.video.current.srcObject !== this.props.feed.stream) {
            this.video.current.srcObject = this.props.feed.stream;
        }
    }

    onDragStart(evt) {
        evt.dataTransfer.setData('id', this.props.feed.id);
    }

    onDragOver(evt) {
        evt.preventDefault();
    }

    onDrop(evt) {
        evt.preventDefault();
        const draggedId = evt.dataTransfer.getData('id');
        const targetId = this.props.feed.id;
        this.props.onDragAndDrop(draggedId, targetId);
    }
}

VideoFeed.propTypes = {
    feed: PropTypes.object.isRequired,
    style: PropTypes.object.isRequired,
    onDragAndDrop: PropTypes.func.isRequired
};

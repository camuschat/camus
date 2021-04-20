import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Feed, swapFeeds } from '../slices/feeds';
import { RootState } from '../store';
import VideoControlBar from './VideoControlBar';

interface VideoStageState {
    videoHeightAspect: number;
    videoWidthAspect: number;
    videoScaleFactor: number;
}

class VideoStage extends Component<PropsFromRedux, VideoStageState> {
    constructor(props: PropsFromRedux) {
        super(props);

        this.state = {
            videoHeightAspect: 3,
            videoWidthAspect: 4,
            videoScaleFactor: 1.0,
        };

        this.updateScaleFactor = this.updateScaleFactor.bind(this);
    }

    render(): React.ReactNode {
        // Associate each feed with the corresponding username
        const users = this.props.users;
        const feeds = this.props.feeds.map((feed) => {
            const user = users.find((user) => user.id === feed.id);
            const username = user ? user.username : 'Major Tom';
            return Object.assign({}, feed, { username });
        });

        const feedHeight = Math.floor(
            this.state.videoScaleFactor * this.state.videoHeightAspect
        );
        const feedWidth = Math.floor(
            this.state.videoScaleFactor * this.state.videoWidthAspect
        );
        const videoFeedStyle = {
            height: `${feedHeight}px`,
            width: `${feedWidth}px`,
        };

        return (
            <ul
                id='video-stage'
                className='video-stage'
                aria-labelledby='video-stage-title'
            >
                <h1 id='video-stage-title' className='sr-only'>
                    Video feeds
                </h1>
                {feeds.map((feed) => (
                    <VideoFeed
                        key={feed.id}
                        feed={feed}
                        style={videoFeedStyle}
                        onDragAndDrop={this.props.swapFeeds}
                    />
                ))}
            </ul>
        );
    }

    componentDidMount(): void {
        // Dynamically update the size of displayed video feeds when the
        // window is resized
        window.addEventListener('resize', () => this.updateScaleFactor());
        this.updateScaleFactor();
    }

    componentDidUpdate(): void {
        const videoScaleFactor = this.calculateScaleFactor(
            this.props.feeds.length,
            this.state.videoHeightAspect,
            this.state.videoWidthAspect
        );

        if (videoScaleFactor !== this.state.videoScaleFactor) {
            this.updateScaleFactor(videoScaleFactor);
        }
    }

    updateScaleFactor(scaleFactor?: number): void {
        this.setState((state, props) => {
            const videoScaleFactor = scaleFactor
                ? scaleFactor
                : this.calculateScaleFactor(
                      props.feeds.length,
                      state.videoHeightAspect,
                      state.videoWidthAspect
                  );

            return {
                videoScaleFactor,
            };
        });
    }

    calculateScaleFactor(
        nItems: number,
        heightAspect: number,
        widthAspect: number,
        minWidth = 0
    ): number {
        const container = document.querySelector('#video-stage') as HTMLElement;

        // "Normalize" the height and width of the container relative to the
        // aspect ratio of the contained items
        const normHeight = container.clientHeight / heightAspect;
        const normWidth = container.clientWidth / widthAspect;

        // The ratio of columns to rows should approximately match the
        // normalized aspect ratio of the container
        const rows = Math.sqrt(nItems * (normHeight / normWidth));
        const columns = Math.sqrt(nItems * (normWidth / normHeight));

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
            [rowsCeiling, columnsCeiling],
        ].filter(([rows, columns]) => rows * columns >= nItems);

        // Compute the maximum scaling factor based on the remaining grid options
        const scaleFactors = gridOptions.map(([rows, columns]) => {
            // The -4 provides a small amount of slack to account for numerical
            // imprecision. Without this slack, occasionally the items are slightly
            // too wide and pushed into a new row, causing overflow.
            const xScale =
                (container.clientWidth - 4) / (columns * widthAspect);
            const yScale = (container.clientHeight - 4) / (rows * heightAspect);
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

// Connect VideoStage to Redux
const mapState = (state: RootState) => ({
    users: state.users,
    feeds: state.feeds,
});

const mapDispatch = {
    swapFeeds,
};

const connector = connect(mapState, mapDispatch, null, { forwardRef: true });

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(VideoStage);

interface VideoFeedProps {
    feed: Feed & { username: string };
    style: object;
    onDragAndDrop: Function;
}

class VideoFeed extends Component<VideoFeedProps> {
    private video: React.RefObject<HTMLVideoElement>;
    private audio: React.RefObject<HTMLAudioElement>;
    private videoContainer: React.RefObject<HTMLDivElement>;

    constructor(props: VideoFeedProps) {
        super(props);

        // Create a ref for the <video> element so that we can act on the DOM
        // directly to update the stream source
        this.video = React.createRef();
        this.audio = React.createRef();
        this.videoContainer = React.createRef();

        this.onDragStart = this.onDragStart.bind(this);
        this.onDragOver = this.onDragOver.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.setAudio = this.setAudio.bind(this);
        this.setVideo = this.setVideo.bind(this);
    }

    render(): React.ReactNode {
        const feed = this.props.feed;

        return (
            <li
                className='video-feed'
                style={this.props.style}
                draggable={'true'}
                onDragStart={this.onDragStart}
                onDragOver={this.onDragOver}
                onDrop={this.onDrop}
                tabIndex={0}
                aria-labelledby={`video-feed-${feed.id}`}
            >
                <h2 id={`video-feed-${feed.id}`} className='sr-only'>
                    {`Video feed for user ${feed.username}`}
                </h2>
                <p className='video-tag'>{feed.username}</p>
                <div ref={this.videoContainer} style={{ height: '100%' }}>
                    <video
                        ref={this.video}
                        id={feed.id}
                        autoPlay={true}
                        playsInline={true}
                        muted={true}
                    />
                </div>
                <audio ref={this.audio} autoPlay={true} />
                <VideoControlBar
                    audioRef={this.audio}
                    videoRef={this.video}
                    videoContainerRef={this.videoContainer}
                    feed={feed}
                    showVisibilityControls={feed.id !== 'local'}
                    showAudioControls={!feed.audioMuted}
                    showResolutionControls={feed.id === 'local'}
                />
            </li>
        );
    }

    componentDidMount(): void {
        const {
            videoStream,
            audioStream,
            audioMuted,
            videoEnabled,
        } = this.props.feed;

        this.setVideo(videoEnabled ? videoStream : null);
        this.setAudio(audioMuted ? null : audioStream);
    }

    componentDidUpdate(): void {
        const {
            videoStream,
            audioStream,
            audioMuted,
            videoEnabled,
        } = this.props.feed;

        this.setVideo(videoEnabled ? videoStream : null);
        this.setAudio(audioMuted ? null : audioStream);
    }

    onDragStart(event: React.DragEvent<HTMLLIElement>): void {
        event.dataTransfer.setData('id', this.props.feed.id);
    }

    onDragOver(event: React.DragEvent<HTMLLIElement>): void {
        event.preventDefault();
    }

    onDrop(event: React.DragEvent<HTMLLIElement>): void {
        event.preventDefault();
        const draggedId = event.dataTransfer.getData('id');
        const targetId = this.props.feed.id;
        this.props.onDragAndDrop({ id1: draggedId, id2: targetId });
    }

    setAudio(stream: MediaStream | null): void {
        if (this.audio.current && this.audio.current.srcObject !== stream) {
            this.audio.current.srcObject = stream;
        }
    }

    setVideo(stream: MediaStream | null): void {
        if (this.video.current && this.video.current.srcObject !== stream) {
            this.video.current.srcObject = stream;
        }
    }
}

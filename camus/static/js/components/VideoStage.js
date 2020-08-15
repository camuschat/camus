import React, {Component} from "react";

export default class VideoStage extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        // Associate each feed with the corresponding username
        const feeds = this.props.feeds;
        const users = this.props.users;
        feeds.forEach(feed => {
            const user = users.find(user => user.id === feed.id);
            feed.username = user ? user.username : 'Major Tom';
        });

        return (
            <ul className='video-stage'>
                {this.props.feeds.map((feed) =>
                    <li key={feed.id}>
                        <VideoFeed feed={feed} />
                    </li>
                )}
            </ul>
        );
    }
}

class VideoFeed extends Component {
    constructor(props) {
        super(props);

        // Create a ref for the <video> element so that we can act on the DOM
        // directly to update the stream source
        this.video = React.createRef();
    }

    render() {
        return (
            <div className='video-feed'>
                <p>{this.props.feed.username}</p>
                <video
                    ref={this.video}
                    id={this.props.feed.id}
                    autoPlay={true}
                    playsInline={true}
                />
            </div>
        );
    }

    componentDidMount() {
        this.video.current.srcObject = this.props.feed.stream;
    }

    componentDidUpdate() {
        this.video.current.srcObject = this.props.feed.stream;
    }
}

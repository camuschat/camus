import React, { Component } from "react";
import ChatMessageBar from './ChatMessageBar.js';
import VideoStage from './VideoStage.js';

export default class App extends Component {
    constructor(props) {
        super(props);
        this.manager = this.props.manager;
        this.state = {
            chatMessages: [],
            feeds: []
        }

        this.onSendChatMessage = this.onSendChatMessage.bind(this);
        this.onReceiveChatMessage = this.onReceiveChatMessage.bind(this);
        this.onVideoPeer = this.onVideoPeer.bind(this);
        this.onVideoPeerRemoved = this.onVideoPeerRemoved.bind(this);

    }

    componentDidMount() {
        this.manager.addMessageListener({type: 'text'}, this.onReceiveChatMessage);
        this.manager.on('videopeer', this.onVideoPeer);
        this.manager.on('videopeerremoved', this.onVideoPeerRemoved);
    }

    render() {
        return (<>
            <ChatMessageBar
                messages={this.state.chatMessages}
                onSend={this.onSendChatMessage}
            />
            <VideoStage
                feeds={this.state.feeds}
            />
        </>)
    }

    async onSendChatMessage(message) {
        const time = new Date().getTime();
        const data = {
            receiver: 'room',
            type: 'text',
            data: {
                from: this.manager.username,
                time: time,
                text: message
            }
        };
        await this.manager.signaler.send(data);
    }

    onReceiveChatMessage(message) {
        const chatMessage = {
            from: message.data.from,
            timestamp: message.data.time,
            text: message.data.text
        };
        this.setState(state => {
            const messages = state.chatMessages.concat(chatMessage);
            return {
                chatMessages: messages
            };
        });
    }

    onVideoPeer(peer) {
        peer.on('track', (track, streams) => {
            track.addEventListener('unmute', () => {
                this.setState(state => {
                    const updatedFeeds = state.feeds.map(feed => {
                        if (feed.id === peer.client_id) {
                            feed.stream = streams[0];
                        }
                        return feed;
                    });
                    return {
                        feeds: updatedFeeds
                    };
                });
            });
        });

        const feed = {
            id: peer.client_id,
            username: peer.username,
            stream: null
        };
        this.setState(state => {
            const feeds = state.feeds.concat(feed);
            return {
                feeds: feeds
            };
        });
    }

    onVideoPeerRemoved(peer) {
        this.setState(state => {
            const feeds = state.feeds.filter(feed => feed.id !== peer.client_id);
            return {
                feeds: feeds
            };
        });
    }
}

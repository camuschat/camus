import React, { Component } from "react";
import ChatMessageBar from './ChatMessageBar.js';
import ConnectionInfoBar from './ConnectionInfoBar.js';
import MediaControlBar from './MediaControlBar.js';
import Sidebar from './Sidebar.js';
import VideoStage from './VideoStage.js';

export default class App extends Component {
    constructor(props) {
        super(props);
        this.manager = this.props.manager;
        this.state = {
            users: [{id: 'local', username: 'Me'}],
            chatMessages: [],
            feeds: [{id: 'local', stream: null}],
            connections: []
        }

        this.onSendChatMessage = this.onSendChatMessage.bind(this);
        this.onReceiveChatMessage = this.onReceiveChatMessage.bind(this);
        this.onVideoPeer = this.onVideoPeer.bind(this);
        this.onVideoPeerRemoved = this.onVideoPeerRemoved.bind(this);
        this.onLocalVideoTrack = this.onLocalVideoTrack.bind(this);
        this.onLocalAudioTrack = this.onLocalAudioTrack.bind(this);
        this.onPeerTrack = this.onPeerTrack.bind(this);
        this.onPeerConnectionChange = this.onPeerConnectionChange.bind(this);
        this.onPeerUsernameChange = this.onPeerUsernameChange.bind(this);
    }

    componentDidMount() {
        this.manager.addMessageListener({type: 'text'}, this.onReceiveChatMessage);
        this.manager.on('videopeer', this.onVideoPeer);
        this.manager.on('videopeerremoved', this.onVideoPeerRemoved);
    }

    render() {
        return (<>
            <main>
                <VideoStage
                    users={this.state.users}
                    feeds={this.state.feeds}
                />
                <MediaControlBar
                    onVideoTrack={this.onLocalVideoTrack}
                    onAudioTrack={this.onLocalAudioTrack}
                />
            </main>
            <Sidebar buttonIcons={['message', 'people']}>
                <ChatMessageBar
                    users={this.state.users}
                    messages={this.state.chatMessages}
                    onSend={this.onSendChatMessage}
                />
                <ConnectionInfoBar
                    users={this.state.users}
                    connections={this.state.connections}
                />
            </Sidebar>
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
            this.onPeerTrack(peer, track, streams);
        });

        peer.on('connectionstatechange', (state) => {
            this.onPeerConnectionChange(peer, 'connectionState', state)
        });

        peer.on('iceconnectionstatechange', (state) => {
            this.onPeerConnectionChange(peer, 'iceConnectionState', state)
        });

        peer.on('icegatheringstatechange', (state) => {
            this.onPeerConnectionChange(peer, 'iceGatheringState', state)
        });

        peer.on('signalingstatechange', (state) => {
            this.onPeerConnectionChange(peer, 'signalingState', state)
        });

        peer.on('usernamechange', (username) => {
            this.onPeerUsernameChange(peer, username);
        });

        const user = {
            id: peer.client_id,
            username: peer.username
        }
        const feed = {
            id: peer.client_id,
            stream: null
        };
        const connection = {
            id: peer.client_id,
            connectionState: peer.connectionState,
            iceConnectionState: peer.iceConnectionState,
            iceGatheringState: peer.iceGatheringState,
            signalingState: peer.signalingState
        };
        this.setState(state => {
            const users = state.users.concat(user);
            const feeds = state.feeds.concat(feed);
            const connections = state.connections.concat(connection);
            return {
                users: users,
                feeds: feeds,
                connections: connections
            };
        });
    }

    onVideoPeerRemoved(peer) {
        this.setState(state => {
            const feeds = state.feeds.filter(feed => feed.id !== peer.client_id);
            const connections = state.connections.filter(connection => connection.id !== peer.client_id);
            return {
                feeds: feeds,
                connections: connections
            };
        });
    }

    onLocalVideoTrack(track) {
        if (track) {
            this.manager.setVideoTrack(track).then();

            // Add local video to video feeds
            this.setState(state => {
                const feeds = state.feeds.slice();
                const feed = feeds.find(feed => feed.id === 'local');
                feed.stream = new MediaStream([track]);
                return {
                    feeds: feeds
                };
            });
        } else {
            this.manager.stopVideo();
        }
    }

    onLocalAudioTrack(track) {
        if (track) {
            this.manager.setAudioTrack(track).then();
        } else {
            this.manager.stopAudio();
        }
    }

    onPeerTrack(peer, track, streams) {
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
    }

    onPeerConnectionChange(peer, kind, status) {
            this.setState(state => {
                const connections = state.connections.slice();
                const idx = connections.findIndex(connection => connection.id === peer.client_id);

                if (idx >= 0) {
                    connections[idx][kind] = status;
                }

                return {
                    connections: connections
                };
            });
    }

    onPeerUsernameChange(peer, username) {
        this.setState(state => {
            const users = state.users.slice();
            const idx = users.findIndex(user => user.id === peer.client_id);

            if (idx >= 0) {
                users[idx].username = username;
            }

            return {
                users: users
            };
        });
    }
}

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Manager} from '../rtcclient.js';
import ChatMessageBar from './ChatMessageBar.js';
import ConnectionInfoBar from './ConnectionInfoBar.js';
import EnterRoomModal from './EnterRoomModal.js';
import MediaControlBar from './MediaControlBar.js';
import Sidebar from './Sidebar.js';
import VideoStage from './VideoStage.js';

export default class App extends Component {
    constructor(props) {
        super(props);
        this.manager = this.props.manager;
        this.state = {
            displayEnterRoomModal: true,
            audioDeviceId: '',
            videoDeviceId: '',
            users: [{id: 'local', username: 'Me'}],
            chatMessages: [],
            feeds: [{id: 'local', audioStream: null, videoStream: null}],
            connections: []
        }

        this.onSubmitModal = this.onSubmitModal.bind(this);
        this.onSendChatMessage = this.onSendChatMessage.bind(this);
        this.onReceiveChatMessage = this.onReceiveChatMessage.bind(this);
        this.onVideoPeer = this.onVideoPeer.bind(this);
        this.onVideoPeerRemoved = this.onVideoPeerRemoved.bind(this);
        this.onLocalVideoTrack = this.onLocalVideoTrack.bind(this);
        this.onLocalAudioTrack = this.onLocalAudioTrack.bind(this);
        this.onPeerTrack = this.onPeerTrack.bind(this);
        this.onPeerConnectionChange = this.onPeerConnectionChange.bind(this);
        this.onPeerUsernameChange = this.onPeerUsernameChange.bind(this);
        this.onSidebarToggle = this.onSidebarToggle.bind(this);
        this.onSwapFeeds = this.onSwapFeeds.bind(this);
    }

    componentDidMount() {
        this.manager.addMessageListener({type: 'text'}, this.onReceiveChatMessage);
        this.manager.on('videopeer', this.onVideoPeer);
        this.manager.on('videopeerremoved', this.onVideoPeerRemoved);

        window.addEventListener('beforeunload', () => {
            this.manager.shutdown();
        });

        window.addEventListener('load', async () => {
            await this.manager.start();
        });
    }

    componentWillUnmount() {
        this.manager.shutdown();
    }

    render() {
        if (this.state.displayEnterRoomModal) {
            return (
                <EnterRoomModal
                    isVisible={this.state.displayEnterRoomModal}
                    onSubmit={this.onSubmitModal}
                />
            );
        }

        return (<>
            <main>
                <VideoStage
                    users={this.state.users}
                    feeds={this.state.feeds}
                    onSwapFeeds={this.onSwapFeeds}
                />
                <MediaControlBar
                    audioDeviceId={this.state.audioDeviceId}
                    videoDeviceId={this.state.videoDeviceId}
                    onVideoTrack={this.onLocalVideoTrack}
                    onAudioTrack={this.onLocalAudioTrack}
                />
            </main>
            <Sidebar
                buttonIcons={['message', 'people']}
                onToggle={this.onSidebarToggle}>
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

    onSubmitModal(username, audioDeviceId, videoDeviceId) {
        this.manager.setUsername(username);
        this.setState({
            displayEnterRoomModal: false,
            audioDeviceId: audioDeviceId,
            videoDeviceId: videoDeviceId
        });
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
                feed.videoStream = new MediaStream([track]);
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
        const stream = streams[0];

        track.addEventListener('unmute', () => {
            this.setState(state => {
                const updatedFeeds = state.feeds.map(feed => {
                    if (feed.id === peer.client_id && stream) {
                        if (track.kind === 'video') {
                            feed.videoStream = stream;
                        } else if (track.kind === 'audio') {
                            feed.audioStream = stream;
                        }
                    }
                    return feed;
                });

                return {
                    feeds: updatedFeeds
                };
            });
        });

        track.addEventListener('mute', () => {
            console.log('Track muted', track);
            this.setState(state => {
                const updatedFeeds = state.feeds.map(feed => {
                    if (feed.id === peer.client_id && stream) {
                        if (track.kind === 'video') {
                            feed.videoStream = null;
                        } else if (track.kind === 'audio') {
                            feed.audioStream = null;
                        }
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

    onSidebarToggle() {
        // When the sidebar is toggled, VideoStage must be re-rendered to
        // update the scaling factor of its VideoFeeds. In the future, the
        // VideoStage should be able to update itself using Resize Observers
        // (see https://drafts.csswg.org/resize-observer-1/).
        this.forceUpdate();
    }

    onSwapFeeds(feedId1, feedId2) {
        this.setState(state => {
            const feeds = state.feeds.slice();
            const idx1 = feeds.findIndex(feed => feed.id === feedId1);
            const idx2 = feeds.findIndex(feed => feed.id === feedId2);
            [feeds[idx1], feeds[idx2]] = [feeds[idx2], feeds[idx1]];

            return {
                feeds: feeds
            };
        });
    }
}

App.propTypes = {
    manager: PropTypes.instanceOf(Manager).isRequired
};

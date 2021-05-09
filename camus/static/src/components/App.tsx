import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { t } from '@lingui/macro';
import { enterRoom, setLocale } from '../slices/app';
import { addUser, updateUser } from '../slices/users';
import { addChatMessage } from '../slices/messages';
import {
    addConnection,
    removeConnection,
    updateConnection,
} from '../slices/connections';
import { addFeed, removeFeed, updateFeed } from '../slices/feeds';
import { addIceServer } from '../slices/iceServers';
import { RootState } from '../store';
import { setLanguage } from '../i18n';
import {
    IceServersMessage,
    Manager,
    MediaPeer,
    TextMessage,
} from '../rtcclient';
import ChatMessageBar from './ChatMessageBar';
import ConnectionInfoBar from './ConnectionInfoBar';
import IceServers from './IceServers';
import Invite from './Invite';
import EnterRoomModal from './EnterRoomModal';
import LanguageSelector from './LanguageSelect';
import MediaControlBar from './MediaControlBar';
import Sidebar from './Sidebar';
import VideoStage from './VideoStage';

interface AppProps extends PropsFromRedux {
    manager: Manager;
}

class App extends Component<AppProps> {
    private manager: Manager;
    private videoStage: React.RefObject<any>;
    private canUpdateIceServers: boolean;

    constructor(props: AppProps) {
        super(props);
        this.manager = this.props.manager;
        this.videoStage = React.createRef();
        this.canUpdateIceServers =
            new RTCPeerConnection().setConfiguration !== undefined;

        this.onSubmitModal = this.onSubmitModal.bind(this);
        this.onReceiveChatMessage = this.onReceiveChatMessage.bind(this);
        this.onReceiveIceServers = this.onReceiveIceServers.bind(this);
        this.onMediaPeer = this.onMediaPeer.bind(this);
        this.onMediaPeerRemoved = this.onMediaPeerRemoved.bind(this);
        this.onPeerTrack = this.onPeerTrack.bind(this);
        this.onPeerConnectionChange = this.onPeerConnectionChange.bind(this);
        this.onPeerUsernameChange = this.onPeerUsernameChange.bind(this);
        this.onSidebarToggle = this.onSidebarToggle.bind(this);
        this.onSelectLanguage = this.onSelectLanguage.bind(this);

        console.log('!App constructor');
    }

    componentDidMount(): void {
        this.manager.addMessageListener(
            { type: 'text' },
            this.onReceiveChatMessage
        );
        this.manager.addMessageListener(
            { type: 'ice-servers' },
            this.onReceiveIceServers
        );
        this.manager.on('mediapeer', this.onMediaPeer);
        this.manager.on('mediapeerremoved', this.onMediaPeerRemoved);

        window.addEventListener('beforeunload', () => {
            this.manager.shutdown();
        });

        window.addEventListener('load', async () => {
            await this.manager.start();
        });

        console.log('!App did mount');
    }

    componentWillUnmount(): void {
        //this.manager.shutdown();
        console.log('!App will unmount');
    }

    render(): React.ReactNode {
        if (this.props.didEnterRoom) {
            return (
                <EnterRoomModal
                    isVisible={this.props.didEnterRoom}
                    onSubmit={this.onSubmitModal}
                />
            );
        }

        return (
            <>
                <header>
                    <LanguageSelector
                        onSelectLanguage={this.onSelectLanguage}
                    />
                </header>
                <main>
                    <VideoStage ref={this.videoStage} />
                    <MediaControlBar />
                    <Invite />
                </main>
                <Sidebar
                    buttonIcons={['message', 'people', 'settings']}
                    buttonAriaLabels={[
                        t`chat window`,
                        t`users window`,
                        t`settings window`,
                    ]}
                    onToggle={this.onSidebarToggle}
                >
                    <ChatMessageBar />
                    <ConnectionInfoBar />
                    <IceServers allowEditing={this.canUpdateIceServers} />
                </Sidebar>
            </>
        );
    }

    onSubmitModal(): void {
        enterRoom();
    }

    onReceiveChatMessage(message: TextMessage): void {
        const chatMessage = {
            from: message.data.from,
            timestamp: message.data.time,
            text: message.data.text,
        };
        this.props.addChatMessage(chatMessage);
    }

    onReceiveIceServers(message: IceServersMessage): void {
        const servers = message.data;
        servers.forEach((server) => {
            // The urls field may either be a single string or an array of
            // strings, so convert it to an array if a single string is given
            if (typeof server.urls === 'string') {
                server.urls = [server.urls];
            }

            const kind = server.urls[0].match(/^(?<kind>stun|turn):/);
            server.kind = kind && kind.groups ? kind.groups.kind : '';
            this.props.addIceServer(server);
        });
    }

    onMediaPeer(peer: MediaPeer): void {
        peer.on('track', (track: MediaStreamTrack) => {
            this.onPeerTrack(peer, track);
        });

        peer.on('connectionstatechange', (state: string) => {
            this.onPeerConnectionChange(peer, 'connectionState', state);
        });

        peer.on('iceconnectionstatechange', (state: string) => {
            this.onPeerConnectionChange(peer, 'iceConnectionState', state);
        });

        peer.on('icegatheringstatechange', (state: string) => {
            this.onPeerConnectionChange(peer, 'iceGatheringState', state);
        });

        peer.on('signalingstatechange', (state: string) => {
            this.onPeerConnectionChange(peer, 'signalingState', state);
        });

        peer.on('usernamechange', (username: string) => {
            this.onPeerUsernameChange(peer, username);
        });

        const user = {
            id: peer.id,
            username: peer.username,
        };
        const feed = {
            id: peer.id,
            videoStream: null,
            audioStream: null,
            videoEnabled: true,
            audioMuted: false,
        };
        const connection = {
            id: peer.id,
            connectionState: peer.connectionState,
            iceConnectionState: peer.iceConnectionState,
            iceGatheringState: peer.iceGatheringState,
            signalingState: peer.signalingState,
        };

        this.props.addUser(user);
        this.props.addFeed(feed);
        this.props.addConnection(connection);
    }

    onMediaPeerRemoved(peer: MediaPeer): void {
        this.props.removeFeed(peer.id);
        this.props.removeConnection(peer.id);
    }

    onPeerTrack(peer: MediaPeer, track: MediaStreamTrack): void {
        const stream = new MediaStream([track]);

        track.addEventListener('unmute', () => {
            console.log('Track unmuted', track, stream);
            const fieldName =
                track.kind == 'video' ? 'videoStream' : 'audioStream';
            const feed = {
                id: peer.id,
                [fieldName]: stream,
            };
            this.props.updateFeed(feed);
        });

        track.addEventListener('mute', () => {
            console.log('Track muted', track);
            const fieldName =
                track.kind == 'video' ? 'videoStream' : 'audioStream';
            const feed = {
                id: peer.id,
                [fieldName]: null,
            };
            this.props.updateFeed(feed);
        });
    }

    onPeerConnectionChange(
        peer: MediaPeer,
        kind: string,
        status: string
    ): void {
        const connection = {
            id: peer.id,
            [kind]: status,
        };
        this.props.updateConnection(connection);
    }

    onPeerUsernameChange(peer: MediaPeer, username: string): void {
        const user = { id: peer.id, username };
        this.props.updateUser(user);
    }

    onSidebarToggle(): void {
        // When the sidebar is toggled, VideoStage must be re-rendered to
        // update the scaling factor of its VideoFeeds. In the future, the
        // VideoStage should be able to update itself using Resize Observers
        // (see https://drafts.csswg.org/resize-observer-1/).
        if (this.videoStage.current) {
            this.videoStage.current.forceUpdate();
        }
    }

    onSelectLanguage(locale: string): void {
        setLocale(locale);
        setLanguage(locale);
        //this.forceUpdate();
        console.log('!onSelectLanguage');
    }
}

const mapState = (state: RootState) => ({
    didEnterRoom: state.app.didEnterRoom,
});

const mapDispatch = {
    enterRoom,
    setLocale,
    addUser,
    updateUser,
    addChatMessage,
    addConnection,
    removeConnection,
    updateConnection,
    addFeed,
    removeFeed,
    updateFeed,
    addIceServer,
};

const connector = connect(mapState, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(App);

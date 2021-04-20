import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Connection } from '../slices/connections';
import { RootState } from '../store';

class ConnectionInfoBar extends Component<PropsFromRedux> {
    render(): React.ReactNode {
        // Associate each connection with the corresponding username
        const users = this.props.users;
        const connections = this.props.connections.map((conn) => {
            const user = users.find((user) => user.id === conn.id);
            const username = user ? user.username : 'Major Tom';
            return Object.assign({}, conn, { username });
        });

        if (connections.length === 0) {
            return (
                <p className='connection-info-node'>
                    <i>There are currently no other users in the room.</i>
                </p>
            );
        }

        return (
            <ul className='connection-info-bar'>
                {connections.map((connection) => (
                    <ConnectionInfoNode
                        key={connection.id}
                        connection={connection}
                    />
                ))}
            </ul>
        );
    }
}

// Connect ConnectionInfoBar to Redux
const mapState = (state: RootState) => ({
    users: state.users,
    connections: state.connections,
});

const connector = connect(mapState);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ConnectionInfoBar);

interface ConnectionInfoNodeProps {
    connection: Connection & { username: string };
}

class ConnectionInfoNode extends Component<ConnectionInfoNodeProps> {
    render(): React.ReactNode {
        const connection = this.props.connection;
        return (
            <li className='connection-info-node'>
                <details>
                    <summary>{connection.username}</summary>
                    <ul>
                        <li key='username'>
                            Username: <span>{connection.username}</span>
                        </li>
                        <li key='id'>
                            Client ID: <span>{connection.id}</span>
                        </li>
                        <li key='connection-state'>
                            Connection state:{' '}
                            <span>{connection.connectionState}</span>
                        </li>
                        <li key='ice-connection-state'>
                            Ice connection state:{' '}
                            <span>{connection.iceConnectionState}</span>
                        </li>
                        <li key='ice-gathering-state'>
                            Ice gathering state:{' '}
                            <span>{connection.iceGatheringState}</span>
                        </li>
                        <li key='signaling-state'>
                            Signaling state:{' '}
                            <span>{connection.signalingState}</span>
                        </li>
                    </ul>
                </details>
            </li>
        );
    }
}

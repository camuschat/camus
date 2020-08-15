import React, { Component } from 'react';

export default class ConnectionInfoBar extends Component {
    render() {
        // Associate each connection with the corresponding username
        const connections = this.props.connections;
        const users = this.props.users;
        connections.forEach(connection => {
            const user = users.find(user => user.id === connection.id);
            connection.username = user ? user.username : 'Major Tom';
        });

        return (
            <ul className='connection-info-bar'>
                {this.props.connections.map((connection) =>
                    <ConnectionInfoNode
                        key={connection.id}
                        connection={connection}
                    />
                )}
            </ul>
        );

    }
}

class ConnectionInfoNode extends Component {
    render() {
        const connection = this.props.connection;
        return (
            <li className='connection-info-node'>
                <button>{connection.username}</button>
                <ul>
                    <li key='username'>
                        Username: <span>{connection.username}</span>
                    </li>
                    <li key='id'>
                        Client ID: <span>{connection.id}</span>
                    </li>
                    <li key='connection-state'>
                        Connection state: <span>{connection.connectionState}</span>
                    </li>
                    <li key='ice-connection-state'>
                        Ice connection state: <span>{connection.iceConnectionState}</span>
                    </li>
                    <li key='ice-gathering-state'>
                        Ice gathering state: <span>{connection.iceGatheringState}</span>
                    </li>
                    <li key='signaling-state'>
                        Signaling state: <span>{connection.signalingState}</span>
                    </li>
                </ul>
            </li>
        );
    }
}

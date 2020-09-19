import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';

class ConnectionInfoBar extends Component {
    render() {
        // Associate each connection with the corresponding username
        const users = this.props.users;
        const connections = this.props.connections.map(conn => {
            const user = users.find(user => user.id === conn.id);
            const username = user ? user.username : 'Major Tom';
            return Object.assign({}, conn, {username});
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
                {connections.map((connection) =>
                    <ConnectionInfoNode
                        key={connection.id}
                        connection={connection}
                    />
                )}
            </ul>
        );

    }
}

ConnectionInfoBar.propTypes = {
    users: PropTypes.array.isRequired,
    connections: PropTypes.array.isRequired
};

function select(state) {
    const {
        users,
        connections
    } = state;

    return {
        users,
        connections
    }
}

export default connect(
    select
)(ConnectionInfoBar);

class ConnectionInfoNode extends Component {
    render() {
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
                </details>
            </li>
        );
    }
}

ConnectionInfoNode.propTypes = {
    connection: PropTypes.object.isRequired
};

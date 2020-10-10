import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {
    addStunServer,
    removeStunServer,
    updateStunServer,
    addTurnServer,
    removeTurnServer,
    updateTurnServer,
} from '../slices/iceServers';

class IceServers extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (<>
            {this.renderStunServers()}
            {this.renderTurnServers()}
        </>);
    }

    renderStunServers() {
        return (<>
            <p>Stun Servers</p>
            <ul className='stun-servers'>
                {this.props.stunServers.filter(server =>
                    server.urls && server.urls.length
                ).map(server =>
                    <IceServer
                        key={server.urls}
                        server={server}
                        onSave={this.props.updateStunServer}
                        onDelete={this.props.removeStunServer}
                        allowEditing={this.props.allowEditing}
                    />
                )}
            </ul>
        </>);
    }

    renderTurnServers() {
        return (<>
            <p>Turn Servers</p>
            <ul className='turn-servers'>
                {this.props.turnServers.filter(server =>
                    server.urls && server.urls.length
                ).map(server =>
                    <IceServer
                        key={server.id}
                        server={server}
                        onSave={this.props.updateTurnServer}
                        onDelete={this.props.removeTurnServer}
                        allowEditing={this.props.allowEditing}
                    />
                )}
            </ul>
        </>);
    }
}

IceServers.propTypes = {
    stunServers: PropTypes.arrayOf(PropTypes.object).isRequired,
    turnServers: PropTypes.arrayOf(PropTypes.object).isRequired,
    allowEditing: PropTypes.bool.isRequired,
    addStunServer: PropTypes.func.isRequired,
    removeStunServer: PropTypes.func.isRequired,
    updateStunServer: PropTypes.func.isRequired,
    addTurnServer: PropTypes.func.isRequired,
    removeTurnServer: PropTypes.func.isRequired,
    updateTurnServer: PropTypes.func.isRequired
};

function select(state) {
    const {
        iceServers
    } = state;

    return {
        stunServers: iceServers.stunServers,
        turnServers: iceServers.turnServers
    }
}

export default connect(
    select,
    {
        addStunServer,
        removeStunServer,
        updateStunServer,
        addTurnServer,
        removeTurnServer,
        updateTurnServer,
    },
)(IceServers);

class IceServer extends Component {
    constructor(props) {
        super(props);

        const {
            urls,
            username,
            credential
        } = this.props.server;

        this.state = {
            urls: urls.join(','),
            username,
            credential
        };

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }

    render() {
        const {server} = this.props;
        const host = server.urls[0];
        const allowEditing = this.props.allowEditing;

        return (
            <li className='ice-server'>
                <details>
                    <summary>{host}</summary>
                    <form onSubmit={this.handleSubmit}>
                        <label>
                            URLs
                            <input
                                name='urls'
                                type='text'
                                value={this.state.urls}
                                onChange={this.handleInputChange}
                                required
                                readOnly={!allowEditing}
                            />
                        </label>
                        <label>
                            Username
                            <input
                                name='username'
                                type='text'
                                value={this.state.username}
                                onChange={this.handleInputChange}
                                readOnly={!allowEditing}
                            />
                        </label>
                        <label>
                            Password
                            <input
                                name='credential'
                                type='text'
                                value={this.state.credential}
                                onChange={this.handleInputChange}
                                readOnly={!allowEditing}
                            />
                        </label>
                        {allowEditing && <>
                            <button type='button' onClick={this.handleDelete}>
                                <i className='material-icons'>delete</i>
                            </button>
                            <button type='submit' onClick={this.handleDelete}>
                                <i className='material-icons'>save</i>
                            </button>
                        </>}
                    </form>
                </details>
            </li>
        );
    }

    handleInputChange(event) {
        const name = event.target.name;
        const value = event.target.value;

        this.setState({
            [name]: value
        });
    }

    handleSubmit() {
        event.preventDefault();

        const {
            urls,
            username,
            credential
        } = this.state;

        const server = {
            id: this.props.server.id,
            urls: urls.split(','),
            username: username ? username : undefined,
            credential: credential ? credential : undefined
        };
        this.props.onSave(server);
    }

    handleDelete() {
        this.props.onDelete(this.props.server.id);
    }
}

IceServer.propTypes = {
    server: PropTypes.object.isRequired,
    allowEditing: PropTypes.bool.isRequired,
    onSave: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
};

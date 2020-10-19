import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {
    addIceServer,
    removeIceServer,
    updateIceServer
} from '../slices/iceServers';

class IceServers extends Component {
    constructor(props) {
        super(props);

        this.newServer = this.newServer.bind(this);
    }

    render() {
        return (
            <div className='ice-servers-bar'>
                {this.renderServers('stun')}
                {this.renderServers('turn')}
            </div>
        );
    }

    renderServers(kind) {
        const {
            iceServers,
            updateIceServer,
            removeIceServer,
            allowEditing
        } = this.props;
        const title = kind[0].toUpperCase() + kind.slice(1) + ' Servers';
        const servers = iceServers.filter(server => server.kind === kind);

        return (
            <div className='ice-servers'>
                <h6>{title}</h6>
                <ul>
                    {servers.filter(server =>
                        server.urls && server.urls.length
                    ).map(server =>
                        <IceServer
                            key={server.id}
                            server={server}
                            onSave={updateIceServer}
                            onDelete={removeIceServer}
                            allowEditing={allowEditing}
                        />
                    )}
                </ul>
                {allowEditing &&
                <button onClick={() => this.newServer(kind)}>
                    <i className='material-icons'>add</i>
                </button>
                }
            </div>
        );
    }

    newServer(kind) {
        const server = {
            urls: [`${kind}:`],
            enabled: false,
            kind
        }
        this.props.addIceServer(server);
    }
}

IceServers.propTypes = {
    iceServers: PropTypes.arrayOf(PropTypes.object).isRequired,
    allowEditing: PropTypes.bool.isRequired,
    addIceServer: PropTypes.func.isRequired,
    updateIceServer: PropTypes.func.isRequired,
    removeIceServer: PropTypes.func.isRequired,
};

function select(state) {
    const {
        iceServers
    } = state;

    return {
        iceServers
    }
}

export default connect(
    select,
    {
        addIceServer,
        updateIceServer,
        removeIceServer
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

        // username and credential may be undefined, so in that case initialize
        // the corresponding properties in our state as empty strings
        this.state = {
            urls: urls.join(','),
            username: username ? username : '',
            credential: credential ? credential : ''
        };

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }

    render() {
        const {
            server,
            allowEditing
        } = this.props;

        // Pattern to validate input for server URLs
        const urlPattern = `${server.kind}:[\\w\\d_./:?=&%-]+`;
        const urlsPattern = `^${urlPattern}(,${urlPattern})*$`

        // Extract the host from a server URL
        const hostMatch = server.urls[0].match(/(?:stun|turn):(?<host>[\w\d_.-]+)/);
        const host = hostMatch ? hostMatch.groups.host : 'New server'

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
                                pattern={urlsPattern}
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
                                required={server.kind === 'turn'}
                                readOnly={!allowEditing}
                            />
                        </label>
                        <label>
                            Password
                            <input
                                name='credential'
                                type='password'
                                value={this.state.credential}
                                onChange={this.handleInputChange}
                                required={server.kind === 'turn'}
                                readOnly={!allowEditing}
                            />
                        </label>
                        {allowEditing && <>
                            <button type='button' onClick={this.handleDelete}>
                                <i className='material-icons'>delete</i>
                            </button>
                            <button type='submit'>
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
            enabled: true,
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

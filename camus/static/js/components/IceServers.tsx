import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import {
    addIceServer,
    removeIceServer,
    updateIceServer,
    IceServer,
} from '../slices/iceServers';
import { RootState } from '../store';

interface IceServersProps extends PropsFromRedux {
    allowEditing: boolean;
}

class IceServers extends Component<IceServersProps> {
    constructor(props: IceServersProps) {
        super(props);

        this.newServer = this.newServer.bind(this);
    }

    render(): React.ReactNode {
        return (
            <div className='ice-servers-bar'>
                {this.renderServers('stun')}
                {this.renderServers('turn')}
            </div>
        );
    }

    renderServers(kind: string): React.ReactNode {
        const {
            iceServers,
            updateIceServer,
            removeIceServer,
            allowEditing,
        } = this.props;
        const title = kind[0].toUpperCase() + kind.slice(1) + ' Servers';
        const servers = iceServers.filter((server) => server.kind === kind);

        return (
            <section className='ice-servers' aria-label={`${kind} servers`}>
                <h6>{title}</h6>
                <ul>
                    {servers
                        .filter((server) => server.urls && server.urls.length)
                        .map((server) => (
                            <IceServerItem
                                key={server.id}
                                server={server}
                                onSave={updateIceServer}
                                onDelete={removeIceServer}
                                allowEditing={allowEditing}
                            />
                        ))}
                </ul>
                {allowEditing && (
                    <button
                        onClick={() => this.newServer(kind)}
                        aria-label={`Add a ${kind} server`}
                    >
                        <i className='material-icons'>add</i>
                    </button>
                )}
            </section>
        );
    }

    newServer(kind: string): void {
        const server = {
            urls: [`${kind}:`],
            enabled: false,
            kind,
        };
        this.props.addIceServer(server);
    }
}

// Connect IceServers to Redux
const mapState = (state: RootState) => ({
    iceServers: state.iceServers,
});

const mapDispatch = {
    addIceServer,
    updateIceServer,
    removeIceServer,
};

const connector = connect(mapState, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(IceServers);

interface IceServerItemProps {
    server: IceServer;
    allowEditing: boolean;
    onSave: Function;
    onDelete: Function;
}

interface IceServerItemState {
    urls: string;
    username: string;
    credential: string;
}

class IceServerItem extends Component<IceServerItemProps, IceServerItemState> {
    constructor(props: IceServerItemProps) {
        super(props);

        const { urls, username, credential } = this.props.server;

        // username and credential may be undefined, so in that case initialize
        // the corresponding properties in our state as empty strings
        this.state = {
            urls: urls.join(','),
            username: username ? username : '',
            credential: credential ? credential : '',
        };

        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }

    render(): React.ReactNode {
        const { server, allowEditing } = this.props;

        // Pattern to validate input for server URLs
        const urlPattern = `${server.kind}:[\\w\\d_./:?=&%-]+`;
        const urlsPattern = `^${urlPattern}(,${urlPattern})*$`;

        // Extract the host from a server URL
        const hostMatch = server.urls[0].match(
            /(?:stun|turn):(?<host>[\w\d_.-]+)/
        );
        const host =
            hostMatch && hostMatch.groups
                ? hostMatch.groups.host
                : 'New server';

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
                        {allowEditing && (
                            <>
                                <button
                                    type='button'
                                    onClick={this.handleDelete}
                                    aria-label={`Delete this ${server.kind} server`}
                                >
                                    <i className='material-icons'>delete</i>
                                </button>
                                <button
                                    type='submit'
                                    aria-label={`Save this ${server.kind} server`}
                                >
                                    <i className='material-icons'>save</i>
                                </button>
                            </>
                        )}
                    </form>
                </details>
            </li>
        );
    }

    handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
        const name = event.target.name;
        const value = event.target.value;

        // @ts-ignore
        this.setState({
            [name]: value,
        });
    }

    handleSubmit(event: React.SyntheticEvent<HTMLFormElement>): void {
        event.preventDefault();

        const { urls, username, credential } = this.state;

        const server = {
            id: this.props.server.id,
            enabled: true,
            urls: urls.split(','),
            username: username ? username : undefined,
            credential: credential ? credential : undefined,
        };
        this.props.onSave(server);
    }

    handleDelete(): void {
        this.props.onDelete(this.props.server.id);
    }
}

import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Message, sendChatMessage } from '../slices/messages';
import { RootState } from '../store';

interface ChatMessageBarState {
    value: string;
}

class ChatMessageBar extends Component<PropsFromRedux, ChatMessageBarState> {
    constructor(props: PropsFromRedux) {
        super(props);
        this.state = {
            value: '',
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
        const value = event.target.value;
        this.setState({ value: value });
    }

    handleSubmit(event: React.SyntheticEvent<HTMLButtonElement>): void {
        event.preventDefault();

        const trimmed = this.state.value.trim();
        if (trimmed) {
            this.props.sendChatMessage(trimmed);
            this.setState({ value: '' });
        }
    }

    render(): React.ReactNode {
        return (
            <div className='chat-message-bar'>
                <ChatMessageLog messages={this.props.messages} />
                <form>
                    <input
                        type='text'
                        placeholder='Send a group chat message'
                        value={this.state.value}
                        onChange={this.handleChange}
                    />
                    <button
                        onClick={this.handleSubmit}
                        aria-label='Send chat message'
                    >
                        <i className='material-icons'>send</i>
                    </button>
                </form>
            </div>
        );
    }
}

// Connect ChatMessageBar to Redux
const mapState = (state: RootState) => ({
    users: state.users,
    messages: state.messages,
});

const mapDispatch = {
    sendChatMessage,
};

const connector = connect(mapState, mapDispatch);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ChatMessageBar);

interface ChatMessageLogProps {
    messages: Message[];
}

class ChatMessageLog extends Component<ChatMessageLogProps> {
    render(): React.ReactNode {
        return (
            <ul className='chat-message-log'>
                {this.props.messages.map((message) => (
                    <li key={message.timestamp}>
                        <ChatMessage
                            from={message.from}
                            timestamp={message.timestamp}
                            text={message.text}
                        />
                    </li>
                ))}
            </ul>
        );
    }
}

interface ChatMessageProps {
    from: string;
    timestamp: number;
    text: string;
}

class ChatMessage extends Component<ChatMessageProps> {
    render(): React.ReactNode {
        return (
            <div className='chat-message'>
                <p className='chat-message-from'>{this.props.from}</p>
                <p className='chat-message-time'>
                    {new Date(this.props.timestamp).toLocaleTimeString('en-US')}
                </p>
                <p className='chat-message-text'>{this.props.text}</p>
            </div>
        );
    }
}

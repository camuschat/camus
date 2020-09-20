import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {sendChatMessage} from '../slices/messages';

class ChatMessageBar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: ''
        };
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        const value = event.target.value;
        this.setState({value: value});
    }

    handleSubmit(event) {
        event.preventDefault();

        const trimmed = this.state.value.trim();
        if (trimmed) {
            this.props.sendChatMessage(trimmed);
            this.setState({value: ''});
        }
    }

    render() {
        return (
            <div className='chat-message-bar'>
                <ChatMessageLog messages={this.props.messages} />
                <form>
                    <input
                        type="text"
                        placeholder="Send a group chat message"
                        value={this.state.value}
                        onChange={this.handleChange}
                    />
                    <button onClick={this.handleSubmit}>
                        <i className='material-icons'>send</i>
                    </button>
                </form>
            </div>
        );
    }
}

ChatMessageBar.propTypes = {
    users: PropTypes.arrayOf(PropTypes.object).isRequired,
    messages: PropTypes.arrayOf(PropTypes.object).isRequired,
    sendChatMessage: PropTypes.func.isRequired
};

function select(state) {
    const {
        users,
        messages
    } = state;

    return {
        users,
        messages
    }
}

export default connect(
    select,
    {sendChatMessage}
)(ChatMessageBar);

class ChatMessageLog extends Component {
    render() {
        return (
            <ul className='chat-message-log'>
                {this.props.messages.map((message) =>
                    <li key={message.timestamp}>
                        <ChatMessage
                            from={message.from}
                            timestamp={message.timestamp}
                            text={message.text}
                        />
                    </li>
                )}
            </ul>
        );
    }
}

ChatMessageLog.propTypes = {
    messages: PropTypes.arrayOf(PropTypes.object).isRequired,
};

class ChatMessage extends Component {
    render() {
        return (
            <div className='chat-message'>
                <p className='chat-message-from'>
                    {this.props.from}
                </p>
                <p className='chat-message-time'>
                    {new Date(this.props.timestamp).toLocaleTimeString("en-US")}
                </p>
                <p className='chat-message-text'>
                    {this.props.text}
                </p>
            </div>
        );
    }
}

ChatMessage.propTypes = {
    from: PropTypes.string.isRequired,
    timestamp: PropTypes.number.isRequired,
    text: PropTypes.string.isRequired
};

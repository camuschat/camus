import React, { Component } from "react";
import ChatMessageBar from "./ChatMessageBar.js";

export default class App extends Component {
    constructor(props) {
        super(props);
        this.manager = this.props.manager;
        this.state = {
            chatMessages: []
        }

        this.onSendChatMessage = this.onSendChatMessage.bind(this);
        this.onReceiveChatMessage = this.onReceiveChatMessage.bind(this);

    }

    componentDidMount() {
        this.manager.addMessageListener({type: 'text'}, this.onReceiveChatMessage);
        this.manager.on('videopeer', this.onVideoPeer);
    }

    render() {
        return (
            <ChatMessageBar
                messages={this.state.chatMessages}
                onSend={this.onSendChatMessage}
            />
        );
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
}

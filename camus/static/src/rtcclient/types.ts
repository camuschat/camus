export interface Client {
    id: string;
    username: string;
}

export interface RoomInfo {
    roomId: string;
    clients: Client[];
}

export interface IceServer {
    urls: string[];
    kind: string;
    username?: string;
    credential?: string;
}

export interface Offer {
    type: 'offer';
    spd: string;
}

export interface Answer {
    type: 'answer';
    spd: string;
}

export interface IceCandidate extends RTCIceCandidateInit {}

export interface Text {
    from: string;
    time: number;
    text: string;
}

export interface Message {
    sender?: string;
    receiver: string;
    type: string;
    data?: any;
}

export interface PingMessage extends Message {
    type: 'ping';
    data: number;
}

export interface PongMessage extends Message {
    type: 'pong';
    data: number;
}

export interface TextMessage extends Message {
    type: 'text';
    data: Text;
}

export interface GetRoomInfoMessage extends Message {
    type: 'get-room-info';
}

export interface RoomInfoMessage extends Message {
    type: 'room-info';
    data: RoomInfo;
}

export interface ProfileMessage extends Message {
    type: 'profile';
    data: {
        username: string;
    };
}

export interface GetIceServersMessage extends Message {
    type: 'get-ice-servers';
}

export interface IceServersMessage extends Message {
    type: 'ice-servers';
    data: IceServer[];
}

export interface OfferMessage extends Message {
    type: 'offer';
    data: Offer;
}

export interface AnswerMessage extends Message {
    type: 'answer';
    data: Answer;
}

export interface IceCandidateMessage extends Message {
    type: 'icecandidate';
    data: IceCandidate;
}

export interface GreetingMessage extends Message {
    type: 'greeting';
    data: string;
}

export interface Bye extends Message {
    type: 'bye';
    data: number;
}

# RTC-Chat

RTC-Chat is a video chat app that implements the core features you'd expect from any such an app:
webcam streaming, desktop sharing, text messaging, and rooms (public or private, password-protected or not).
Media and data streaming are implemented using [WebRTC](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API),
which allows for direct peer-to-peer connections between clients.
The server (nicknamed Ground Control) is implemented in Python using [Quart](https://github.com/pgjones/quart/)
(a Flask-like asynchronous web framework) and [aiortc](https://aiortc.readthedocs.io/).
The server is responsible for managing rooms and relaying messages between clients
(including [signaling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)).
The client is implemented in Javascript and makes use of the WebRTC web APIs.
[Bootstrap](https://getbootstrap.com/) is used for the user interface.


## Features
- Webcam streaming
- Desktop sharing
- Text chat
- Room management (public/private, password/no password, guest limits)


## Running

### Using Python

RTC-Chat requires [Python 3.7](https://docs.python.org/3.7/whatsnew/3.7.html) or higher since it makes use of Quart and async syntax.

As usual, it's best to use a virtual environment.

Install dependencies:

```
$ pip install -r requirements.txt
```

If the installation fails, you may be missing system packages required by the `av` package (a dependency of aiortc).
On Ubuntu, try installing the following packages:


```
$ sudo apt-get install -y \
    gcc \
    libavdevice-dev \
    libavfilter-dev \
    libopus-dev \
    libvpx-dev \
    pkg-config \
    python-dev
```

Run using Quart:

```
$ quart run
```

Go to `localhost:5000` in your browser. For local testing, you can visit the same room in multiple tabs and each tab
will act as a separate client.

### Using Docker

Build the image:

```
$ docker build -t rtc-chat .
```

Run a container:

```
$ ./docker-run.sh
```

Go to `localhost:5000` in your browser. For local testing, you can visit the same room in multiple tabs and each tab
will act as a separate client.


## How it works

When a user enters a room, the client attempts to establish a WebRTC data connection with the server (Ground Control)
by POSTing an [offer](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer)
to the `/rtc/<room_id>/offer` HTTP endpoint. The server returns a JSON-encoded answer to the client's offer,
and if the negotiation is successful, the connection is established. The client and server can use the data connection to
pass messages back and forth. For example a `room-info` message provides the client with information about other clients connected to
the room. The server also provides relaying for client-client messages, in effect allowing it to act as a signaling server.
Clients use this signaling channel to exchange offers and answers when negotiating a peer-to-peer WebRTC connection.

### Server-side components
- ChatRoom -- manages client connections and room information for a given room
- ChatClient -- represents a client which is connected to a room
- ChatManager -- manages chat rooms and handles message relaying

### Client-side componenets
- GroundControl -- manages the connection to the server
- VideoPeer -- represents another client in the same room
- Manager -- manages GroundControl and all VideoPeers

### Messaging Protocol

Clients exchange messages with the server using a JSON-based protocol.
Different message types allow various types of data to be exchanged, for example a simple ping/pong or
the retrieval of information about the room and clients.
Some message types expect a response (e.g. `ping` -> `pong`; `get-room-info` -> `room-info`)
while others do not (e.g. `text`, `greeting`, `bye`).

#### Message Types

Most messages contain a few common headers, which are keys in the JSON message object:
  - `sender` -- a string containing the address (often the client-ID) of the sending party
  - `receiver` -- a string containing the address (often the client-ID) of the receiving party
  - `type` -- the type of message, such as `ping`, `room-info`, or `bye`
  - `data` -- the payload, whose structure depends on `type`

- ping -- a simple message to which a `pong` reply is expected

    ```
    {sender: '',
     receiver: '',
     type: 'ping',
     data: ''}
     ```

- pong -- the expected response when a `ping` message is received.
  If the `ping` contains a `data` field, the `pong` should provide the same `data` back.

    ```
    {sender: '',
     receiver: '',
     type: 'pong',
     data: ''}
    ```

- text -- a message from a user which consists of text

    ```
    {sender: '',
     receiver: '',
     type: 'text',
     data: {from: '',
            time: '',
            text: ''}}
    ```

- get-room-info -- request information about the room and connected clients

    ```
    {sender: '',
     receiver: '',
     type: 'get-room-info'}
    ```

- room-info -- supply information about the room and connected clients

    ```
    {sender: '',
     receiver: '',
     type: 'room-info',
     data: {room_id: '',
            clients: [{id: '', username: ''}]}
    ```

- profile -- an information update about a client, such as the client's username

    ```
    {sender: '',
     receiver: '',
     type: 'profile',
     data: {username: ''}}
    ```

- offer -- an offer to establish an RTCPeerConnection, to which an `answer` is expected

    ```
    {sender: '',
     receiver: '',
     type: 'offer',
     data: ''}
    ```

- answer -- a reply to an `offer`

    ```
    {sender: '',
     receiver: '',
     type: 'answer',
     data: ''}
    ```

- greeting -- a friendly greeting

    ```
    {sender: '',
     receiver: '',
     type: 'greeting',
     data: ''}
    ```

- bye -- a notification to the other party that the connection is about to be terminated

    ```
    {sender: '',
     receiver: '',
     type: 'bye',
     data: ''}
    ```


## Known Issues
- Clients aren't always reaped, so it sometimes appears that there are more clients than are actually connected to a given room.
- Depending on things like firewalls and network topology, it may be impossible to establish a direct WebRTC
  connection with a peer. Potential solutions are to route media streams to clients via the server, or to use a TURN
  server, neither of which is currently implemented in this project. Peer-to-peer connections are more likely to work
  when confined to e.g. your local network rather than the global internet.


## TODO
- Database. Currently, the server stores all room and client info in memory.
- Scaling. Because of the above, load balancing (i.e. running multiple instances of the server) is not currently possible.
  The ability to support multiple instances also requires us to think about how to manage our RTC peer connections, which are inherently stateful.
- Stream via server. Currently, all video and audio tracks are streamed directly between clients using WebRTC.
  Peer-to-peer streaming doesn't scale well in terms of bandwidth usage, since every client must share a connection with every other client
  (that is, the total number of connections scales with the square of the number of clients).
  A solution to this problem is to use a selective forwarding unit (SFU): each client streams its media to the server
  (rather than to each peer) and the server forwards media tracks to each client that is connected to the room.

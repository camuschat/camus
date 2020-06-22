[![Build Status](https://travis-ci.org/mrgnr/camus.svg?branch=master)](https://travis-ci.org/mrgnr/camus)
[![PyPI](https://img.shields.io/pypi/v/camus-chat)](https://pypi.org/project/camus-chat)
[![License](https://img.shields.io/github/license/mrgnr/camus)](LICENSE)

[![Donate using Liberapay](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/mrgnr/donate)

# Camus

Camus is a video chat app that implements the core features you'd expect from any such an app:
webcam streaming, desktop sharing, text messaging, and rooms (public or private, password-protected or not).
Media and data streaming are implemented using [WebRTC][webrtc-api],
which allows for direct peer-to-peer connections between clients.
The server (nicknamed Ground Control) is implemented in Python using [Quart][quart-github]
(a Flask-like asynchronous web framework) and [aiortc][aiortc-docs].
The server is responsible for managing rooms and relaying messages between clients
(including [signaling][signaling-docs]).
The client is implemented in Javascript and makes use of the WebRTC web APIs.
[Bootstrap][bootstrap-docs] is used for the user interface.


## Features
- Webcam streaming
- Desktop sharing
- Text chat
- Room management (public/private, password/no password, guest limits)


## Demo

You can find a live demo at [https://chat.mrgnr.io/rtc](https://chat.mrgnr.io/rtc).


## Running

### Using Python

Camus requires [Python 3.7][python-37-whatsnew] or higher since it makes use of Quart and async syntax.

As usual, it's best to use a virtual environment.

Make sure you have system packages required by the `av` package (a dependency of aiortc) installed.
On Ubuntu/Debian:

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

Install Camus:

```
$ pip install camus-chat
```

Run Camus:

```
$ camus
```

Go to `localhost:5000` in your browser. For local testing, you can visit the same room in multiple tabs and each tab
will act as a separate client.

### Using Docker

Build the image:

```
$ docker build -t camus .
```

Run a container:

```
$ ./docker-run.sh
```

Go to `localhost:5000` in your browser. For local testing, you can visit the same room in multiple tabs and each tab
will act as a separate client.


## How it works

When a user enters a room, the client attempts to establish a WebRTC data connection with the server (Ground Control)
by POSTing an [offer][createoffer-docs]
to the `/rtc/<room_id>/offer` HTTP endpoint. The server returns a JSON-encoded answer to the client's offer,
and if the negotiation is successful, the connection is established. The client and server can use the data connection to
pass messages back and forth. For example a `room-info` message provides the client with information about other clients connected to
the room. The server also provides relaying for client-client messages, in effect allowing it to act as a signaling server.
Clients use this signaling channel to exchange offers and [answers][createanswer-docs]
when negotiating a peer-to-peer WebRTC connection.

### Server-side components
- ChatRoom -- manages client connections and room information for a given room
- ChatClient -- represents a client which is connected to a room
- ChatManager -- manages chat rooms and handles message relaying

### Client-side componenets
- GroundControl -- manages the connection to the server
- VideoPeer -- represents another client in the same room
- Manager -- manages GroundControl and all VideoPeers

### Messaging Protocol

See the [messaging protocol documentation][messaging-docs].


## Development

See the [development documentation][development-docs] for build & test instructions.

## Known Issues
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


[webrtc-api]: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
[quart-github]: https://github.com/pgjones/quart/
[aiortc-docs]: https://aiortc.readthedocs.io/
[signaling-docs]: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
[bootstrap-docs]: https://getbootstrap.com/
[python-37-whatsnew]: https://docs.python.org/3.7/whatsnew/3.7.html
[createoffer-docs]: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
[createanswer-docs]: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
[messaging-docs]: docs/messaging-protocol.md
[development-docs]: docs/development.md

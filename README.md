# Camus

[![Build Status](https://travis-ci.org/mrgnr/camus.svg?branch=master)](https://travis-ci.org/mrgnr/camus)
[![PyPI](https://img.shields.io/pypi/v/camus-chat)](https://pypi.org/project/camus-chat)
[![License](https://img.shields.io/github/license/mrgnr/camus)](LICENSE)

[![Donate using Liberapay](https://liberapay.com/assets/widgets/donate.svg)](https://liberapay.com/mrgnr/donate)

Camus is a video chat app that uses [WebRTC][webrtc-api] for direct peer-to-peer communication.
Users can create public or private rooms, optionally protected by a password.
In addition to streaming audio and video from a webcam and microphone, Camus also provides screen
sharing and text chat.


## Features
- Webcam streaming
- Desktop sharing
- Text chat
- Room management (public/private, password/no password, guest limits)


## Demo

You can find a live demo at [https://camus.chat](https://camus.chat).


## Running

### Using Python

Camus requires [Python 3.7][python-37-whatsnew] or higher since it makes use of [Quart][quart-gitlab] and async syntax.
As usual, it's best to use a virtual environment.

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

See the [technical overview][technical-docs] to understand how Camus works.


## Development

See the [development documentation][development-docs] for build & test instructions.


## Roadmap

### v0.1
- [x] Audio/video streaming
- [x] Desktop sharing
- [x] Text chat
- [x] Cross-browser support (using [Babel][babel-github], [Adapter][adapter-github])
  - [x] Chromium/Chrome/Brave
  - [x] Firefox
  - [x] Safari
- [x] Support [TURN][webrtc-turn] server

### v0.2
- [ ] Rewrite the UI using [React][react-github]
- [ ] Configurable TURN server in the client
- [ ] Debian package

### v0.3+
- [ ] Persistent storage (SQLite, Redis, and/or PostgreSQL)
- [ ] User accounts, persistent user settings
- [ ] Support [SFU][sfu-webrtcglossary] for client scalability


[webrtc-api]: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
[quart-gitlab]: https://gitlab.com/pgjones/quart
[python-37-whatsnew]: https://docs.python.org/3.7/whatsnew/3.7.html
[technical-docs]: https://github.com/mrgnr/camus/blob/master/docs/technical-overview.md
[development-docs]: https://github.com/mrgnr/camus/blob/master/docs/development.md
[babel-github]: https://github.com/babel/babel
[adapter-github]: https://github.com/webrtcHacks/adapter
[webrtc-turn]: https://webrtc.org/getting-started/turn-server
[react-github]: https://github.com/facebook/react
[sfu-webrtcglossary]: https://webrtcglossary.com/sfu/

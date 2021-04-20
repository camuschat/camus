Architecture
============

Camus consists of a server implemented with Python+Quart and a client
implemented with TypeScript+React. The client and server exchange information
over a websocket using a JSON-based `messaging protocol`_, which facilitates
`signaling`_ and allows clients to establish peer-to-peer WebRTC connections.

Server
------

The server is implemented with `Quart`_, an asynchronous Flask-like web
framework written in Python. The server is primarily responsible for managing
rooms and clients and facilitating signaling between clients. A database
(either `SQLite`_ or `Postgresql`_) is used to store information about rooms
and clients. The server uses websockets to share data with clients, including
information about rooms and available ICE servers.


Client
------

The client is implemented in TypeScript. It relies heavily on the `WebRTC API`_
to establish direct peer-to-peer connections and `React`_ for the user
interface. Client-side application state is stored with `Redux`_.

Messaging Protocol
------------------

Clients exchange messages with the server over websockets using a JSON-based protocol.
Different message types allow various types of data to be exchanged, for
example a simple ping/pong or the retrieval of information about the
room and clients. Some message types expect a response (e.g. ``ping`` ->
``pong``; ``get-room-info`` -> ``room-info``) while others do not (e.g.
``text``, ``greeting``, ``bye``).

Most messages contain a few common headers, which are keys in the JSON
message object:

-  ``sender`` -- a string containing the address (often the client-ID)
   of the sending party
-  ``receiver`` -- a string containing the address (often the client-ID)
   of the receiving party
-  ``type`` -- the type of message, such as ``ping``, ``room-info``, or
   ``bye``
-  ``data`` -- the payload, whose structure depends on ``type``

Ping
~~~~

A simple message to which a ``pong`` reply is expected. The ``data`` field
should contain a current timestamp.

.. code-block:: JSON

      {
        "sender": "ground control",
        "receiver": "d86f5959c08d48ffb244ffd5e621871e",
        "type": "ping",
        "data": 1615918847680
      }

Pong
~~~~

A response to a ``ping``. The contents of the ``data`` field should be
identical to that of the corresponding ``ping``.

.. code-block:: JSON

      {
        "sender": "d86f5959c08d48ffb244ffd5e621871e",
        "receiver": "ground control",
        "type": "pong",
        "data": 1615918847680
      }

Text
~~~~

A chat message which is intended for other clients connected to the room.

.. code-block:: JSON

      {
        "sender": "f881d631e61a40f7b5c64d3af9493bf0",
        "receiver": "d86f5959c08d48ffb244ffd5e621871e",
        "type": "text",
        "data": {
            "from": "Ted",
            "time": 1615918847680,
            "text": "All we are is dust in the wind, dude."
        }
      }

Get Room Info
~~~~~~~~~~~~~

A request for information about the room and connected clients.

.. code-block:: JSON

      {
        "sender": "d86f5959c08d48ffb244ffd5e621871e",
        "receiver": "ground control",
        "type": "get-room-info"
      }

Room Info
~~~~~~~~~

Information about the room and connected clients. This message should be sent
from the server in response to a client which sends it a ``get-room-info``
message.

.. code-block:: JSON

      {
        "sender": "ground control",
        "receiver": "d86f5959c08d48ffb244ffd5e621871e",
        "type": "room-info",
        "data": {
          "room_id": "excellent-adventure",
          "clients": [
            {
              "id": "d86f5959c08d48ffb244ffd5e621871e",
              "username": "Bill"
            },
            {
              "id": "f881d631e61a40f7b5c64d3af9493bf0",
              "username": "Ted"
            }
          ]
        }
      }

Profile
~~~~~~~

An information update about a client, such as the client's username.

.. code-block:: JSON

      {
        "sender": "d86f5959c08d48ffb244ffd5e621871e",
        "receiver": "ground control",
        "type": "profile",
        "data": {
          "username": "Bill"
        }
      }

Get ICE Servers
~~~~~~~~~~~~~~~

A request for information about available STUN and TURN servers.

.. code-block:: JSON

      {
        "sender": "d86f5959c08d48ffb244ffd5e621871e",
        "receiver": "ground control",
        "type": "get-ice-servers"
      }

ICE Servers
~~~~~~~~~~~

Information about available STUN and TURN servers. This message should be sent
from the server in response to a client which sends it a ``get-ice-servers``
message.

.. code-block:: JSON

      {
        "sender": "ground control",
        "receiver": "d86f5959c08d48ffb244ffd5e621871e",
        "type": "ice-servers",
        "data": [
            {
              "urls": [
                "stun:turn.example.com:3478"
              ],
              "kind": "stun"
            },
            {
              "urls": [
                "turn:turn.example.com:3478"
              ],
              "username": "1615934570:d86f5959c08d48ffb244ffd5e621871e",
              "credential": "ifiW349BM2jX4+UnzRl0Da7GrA0=",
              "kind": "turn"
            }
          ]
        }

Offer
~~~~~

An `offer`_ to establish an `RTCPeerConnection`_, to which an ``answer`` is expected.

.. code-block:: JSON

      {
        "sender": "f881d631e61a40f7b5c64d3af9493bf0",
        "receiver": "d86f5959c08d48ffb244ffd5e621871e",
        "type": "offer",
        "data": {
          "type": "offer",
           "sdp": "v=0\r\no=- 3924465504085920629 2 IN IP4 127.0...."
        }
      }

Answer
~~~~~~

An `answer`_ to an ``offer``.

.. code-block:: JSON

      {
        "sender": "d86f5959c08d48ffb244ffd5e621871e",
        "receiver": "f881d631e61a40f7b5c64d3af9493bf0",
        "type": "answer",
        "data": {
          "type": "answer",
          "sdp": "v=0\r\no=- 1134820208031418978 2 IN IP4 127.0...."
        }
      }

ICE candidate
~~~~~~~~~~~~~

An `ICE candidate`_ used to establish an `RTCPeerConnection`_.

.. code-block:: JSON

      {
        "sender": "d86f5959c08d48ffb244ffd5e621871e",
        "receiver": "f881d631e61a40f7b5c64d3af9493bf0",
        "type": "icecandidate",
        "data": {
          "candidate": "candidate:3885250869 1 udp 2122260223 17...",
          "sdpMid": "2",
          "sdpMLineIndex": 2
        }
      }

Greeting
~~~~~~~~

A friendly greeting.

.. code-block:: JSON

      {
        "sender": "ground control",
        "receiver": "d86f5959c08d48ffb244ffd5e621871e",
        "type": "greeting",
        "data": "This is Ground Control to Major Tom"
      }

Bye
~~~

A notification to the other party that the connection is about to be
terminated. This message should be sent by clients to the server when
disconnecting from a room. The server should forward this message to other
clients in the room.

.. code-block:: JSON

      {
        "sender": "d86f5959c08d48ffb244ffd5e621871e",
        "receiver": "f881d631e61a40f7b5c64d3af9493bf0",
        "type": "bye",
        "data": 1615919897795
      }

.. _messaging protocol: #messaging-protocol
.. _signaling: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
.. _Quart: https://pgjones.gitlab.io/quart/
.. _SQLite: https://sqlite.org/index.html
.. _Postgresql: https://www.postgresql.org/
.. _WebRTC API: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
.. _React: https://reactjs.org/
.. _Redux: https://redux.js.org/
.. _offer: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
.. _answer: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
.. _RTCPeerConnection: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
.. _ICE candidate: https://developer.mozilla.org/en-US/docs/Web/API/RTCIceCandidate
.. _RTCPeerConnection: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection

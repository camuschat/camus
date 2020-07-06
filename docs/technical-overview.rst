Technical overview
==================

When a user enters a room, the client establishes a `WebSocket`_ connection
with the server, which is used to exchange JSON-encoded `messages`_.
For example, a ``room-info`` message provides the client with information
about other clients connected to the room. This communication channel is also
used for `signaling`_, in which clients exchange `offers`_ and `answers`_ to
negotiate WebRTC peer connections for streaming audio and video.

Server-side components
----------------------

-  ChatRoom -- manages clients and room information for a given room
-  ChatClient -- represents a client which is connected to a room
-  ChatManager -- manages chat rooms and handles message relaying

Client-side componenets
-----------------------

-  Signaler -- passes messages between the client and server using a
   WebSocket
-  VideoPeer -- represents another client in the room and streams media
   using `RTCPeerConnection`_
-  Manager -- manages the Signaler and all VideoPeers

Messaging Protocol
------------------

Clients exchange messages with the server using a JSON-based protocol.
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

Message Types
~~~~~~~~~~~~~

-  ping -- a simple message to which a ``pong`` reply is expected

   ::

      {sender: '',
       receiver: '',
       type: 'ping',
       data: ''}

-  pong -- the expected response when a ``ping`` message is received. If
   the ``ping`` contains a ``data`` field, the ``pong`` should provide
   the same ``data`` back.

   ::

      {sender: '',
       receiver: '',
       type: 'pong',
       data: ''}

-  text -- a message from a user which consists of text

   ::

      {sender: '',
       receiver: '',
       type: 'text',
       data: {from: '',
              time: '',
              text: ''}}

-  get-room-info -- request information about the room and connected
   clients

   ::

      {sender: '',
       receiver: '',
       type: 'get-room-info'}

-  room-info -- supply information about the room and connected clients

   ::

      {sender: '',
       receiver: '',
       type: 'room-info',
       data: {room_id: '',
              clients: [{id: '', username: ''}]}}

-  profile -- an information update about a client, such as the client's
   username

   ::

      {sender: '',
       receiver: '',
       type: 'profile',
       data: {username: ''}}

-  get-ice-servers -- request information about available STUN and TURN
   servers

   ::

      {sender: '',
       receiver: '',
       type: 'get-ice-servers'}

-  ice-servers -- supply information about available STUN and TURN
   servers

   ::

      {sender: '',
       receiver: '',
       type: 'ice-servers',
       data: [{urls: ['']},
              {urls: [''], username: '', credential: ''}]}

-  offer -- an offer to establish an RTCPeerConnection, to which an
   ``answer`` is expected

   ::

      {sender: '',
       receiver: '',
       type: 'offer',
       data: ''}

-  answer -- a reply to an ``offer``

   ::

      {sender: '',
       receiver: '',
       type: 'answer',
       data: ''}

-  greeting -- a friendly greeting

   ::

      {sender: '',
       receiver: '',
       type: 'greeting',
       data: ''}

-  bye -- a notification to the other party that the connection is about
   to be terminated

   ::

      {sender: '',
       receiver: '',
       type: 'bye',
       data: ''}

.. _WebSocket: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
.. _messages: #messaging-protocol
.. _signaling: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
.. _offers: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer
.. _answers: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createAnswer
.. _RTCPeerConnection: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection

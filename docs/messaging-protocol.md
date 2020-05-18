# Messaging Protocol

Clients exchange messages with the server using a JSON-based protocol.
Different message types allow various types of data to be exchanged, for example a simple ping/pong or
the retrieval of information about the room and clients.
Some message types expect a response (e.g. `ping` -> `pong`; `get-room-info` -> `room-info`)
while others do not (e.g. `text`, `greeting`, `bye`).

Most messages contain a few common headers, which are keys in the JSON message object:
  - `sender` -- a string containing the address (often the client-ID) of the sending party
  - `receiver` -- a string containing the address (often the client-ID) of the receiving party
  - `type` -- the type of message, such as `ping`, `room-info`, or `bye`
  - `data` -- the payload, whose structure depends on `type`


## Message Types

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

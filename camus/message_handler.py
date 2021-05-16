import asyncio
import datetime
import json
import logging
from collections import defaultdict

from camus import db
from camus.models import Client
from camus.util import commit_database, get_ice_servers


class MessageHandler:
    """Receives, processes, and sends messages.

    Messages are received via the inbox queue and sent via an outbox queue.
    Received messages are handled according to the destination and are either
    forwarded to another client, broadcast to a room, or processed locally.
    """

    def __init__(self):
        self._address = 'ground control'
        self.inbox = None
        self.outbox = defaultdict(asyncio.Queue)
        self._inbox_task = None

    def start(self):
        self.inbox = asyncio.Queue()
        self._inbox_task = asyncio.create_task(self._process_inbox())

    def stop(self):
        if self._inbox_task:
            self._inbox_task.cancel()

    def send(self, message):
        """Add a message to the outbox."""
        receiver = message.receiver
        data = message.json()
        self.outbox[receiver].put_nowait(data)

    def broadcast(self, room, message):
        """Add a message to the outbox for every client in the given room."""
        for client in room.clients:
            msg = Message(message.json())
            msg.receiver = client.uuid
            self.send(msg)

    async def _process_inbox(self):
        """Remove and process messages from the inbox."""

        while True:
            try:
                client_uuid, data = await self.inbox.get()
                message = Message(data)
                message.sender = client_uuid

                # Update seen & active timestamps for client and room
                client = Client.query.filter_by(uuid=client_uuid).first()
                client.seen = client.room.active = datetime.datetime.utcnow()
                commit_database()

                # Message intended for the server
                if message.receiver == self._address:
                    self._handle_local_message(message)

                # Message to be sent to all clients in the room
                elif message.receiver == 'room':
                    self.broadcast(client.room, message)

                # Message to another client
                else:
                    # TODO: validate receiver is in same room
                    self.send(message)

            except Exception as e:
                logging.exception('Error processing inbox')

    def _handle_local_message(self, message):
        """Handle a message according to its type."""

        reply = Message()
        reply.sender = self._address
        reply.receiver = message.sender

        if message.type == 'ping':
            reply.type = 'pong'
            reply.data = message.data
            logging.info('got ping')

        elif message.type == 'pong':
            logging.info('Got pong {} from client {}'.format(message.data, message.sender))
            reply = None

        elif message.type == 'profile':
            logging.info('got profile')
            client = Client.query.filter_by(uuid=message.sender).first()

            username = message.data.get('username')
            if username:
                client.name = username
                commit_database()

            reply.type = 'room-info'
            reply.data = self._room_info(client.room)
            self.broadcast(client.room, reply)
            reply = None

        elif message.type == 'get-room-info':
            logging.info('got get-room-info')
            client = Client.query.filter_by(uuid=message.sender).first()
            reply.type = 'room-info'
            reply.data = self._room_info(client.room)

        elif message.type == 'get-ice-servers':
            logging.info('got get-ice-servers')
            reply.type = 'ice-servers'
            reply.data = get_ice_servers(message.sender)
            logging.info('\t-> Done getting ice servers: {}'.format(reply.data))

        elif message.type == 'greeting':
            logging.info('Greeting received from client {}: {}'.format(message.sender, message.data))
            reply = None

        elif message.type == 'bye':
            logging.info('got bye')

            client = Client.query.filter_by(uuid=message.sender).first()
            room = client.room

            # Delete client object from db
            db.session.delete(client)
            commit_database()

            # Remove message queues associated with the client
            self.outbox.pop(client.uuid, None)

            # Broadcast updated room info to remaining clients
            reply.type = 'room-info'
            reply.data = self._room_info(room)
            self.broadcast(client.room, reply)
            reply = None

        else:
            reply.type = 'error'
            reply.data = 'Unknown message type: {}'.format(message.type)

        if reply:
            self.send(reply)

    def _room_info(self, room):
        """
        Get information about the room, consisting of the room ID and a list of
        connected clients.
        """

        clients = [{'id': client.uuid, 'username': client.name}
                   for client in room.clients]

        return {'room_id': room.slug, 'clients': clients}

    def send_ping(self, receiver):
        """Send a ping message to the given receiver."""
        ping = Message()
        ping.type = 'ping'
        ping.sender = self._address
        ping.receiver = receiver
        ping.data = datetime.datetime.utcnow().timestamp()
        self.send(ping)

    def send_bye(self, receiver):
        """Send a bye message to the given receiver."""
        bye = Message()
        bye.type = 'bye'
        bye.sender = self._address
        bye.receiver = receiver
        bye.data = datetime.datetime.utcnow().timestamp()
        self.send(bye)

    def broadcast_room_info(self, room):
        """Send a room-info message to clients in the given room."""
        info = Message()
        info.type = 'room-info'
        info.sender = self._address
        info.data = self._room_info(room)
        self.broadcast(room, info)


class Message:
    """A structured message that can be sent to a client."""

    def __init__(self, message=None):
        if isinstance(message, str):
            _json = json.loads(message)
        elif message is None:
            _json = {}
        else:
            _json = message

        self.sender = _json.get('sender')
        self.receiver = _json.get('receiver')
        self.type = _json.get('type')
        self.data = _json.get('data')

    def json(self):
        """Get the JSON-encoded representation of the message."""
        return json.dumps(self.__dict__)

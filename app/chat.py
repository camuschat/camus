import asyncio
from asyncio import Queue

import json
import logging
import uuid

from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription

_chat_manager = None

async def get_chat_manager():
    global _chat_manager
    if _chat_manager is None:
        _chat_manager = ChatManager()
    return _chat_manager

class ChatManagerException(Exception):
    pass

class ChatRoom:
    def __init__(self, id):
        logging.info('Create ChatRoom {}'.format(id))
        self.id = id
        self.clients = {}

    def add_client(self, client):
        self.clients[client.id] = client
        client.room = self

    def get_clients(self):
        return self.clients.values()

    async def sdp_notify(self, client):
        '''
        Notify all clients in the room of the given client's sdp.
        '''

        for _client in self.clients.values():
            data = {'sender': client.id,
                    'receiver': _client.id,
                    'type': 'sdp',
                    'data': {'sdp': client.sdp},
                   }
            _client.send(data)

class ChatClient:
    def __init__(self, id, room=None, pc=None):
        logging.info('Create ChatClient {}'.format(id))
        self.id = id
        self.room = room
        self.datachannel = None
        self.sdp = None
        self.messageq = Queue()

        if pc is not None:
            self.pc = pc
        self.pc = self.create_peer_connection()

    def enter_room(self, room):
        self.room = room
        room.add_client(self)

    def create_peer_connection(self):
        '''
        Create a peer connection for use between the client and server.
        '''

        logging.info('Create peer connection for {}'.format(self.id))
        self.pc = RTCPeerConnection()

        #@self.pc.on("iceconnectionstatechange")
        #async def on_iceconnectionstatechange():
        #    logging.info("ICE connection state: {}".format(pc.iceConnectionState))

        #@self.pc.on("track")
        #def on_track(track):
        #    logging.info("{} track received: {}".format(track.kind, track.id))
        #    pc.addTrack(track)

        #self.datachannel = self.pc.createDataChannel('data')
        @self.pc.on("datachannel")
        def on_datachannel(channel):
            logging.info('Data channel created for client {}'.format(self.id))
            self.datachannel = channel
            #channel.send('ping')


        #@self.datachannel.on("message")
        #async def on_message(message):
        #    logging.info('Client {} received message: {}'.format(self.id, message))
        #    chat_message = ChatMessage(message)
        #    if chat_message.sender is None:
        #        chat_message.sender = self.id
        #    await self.messageq.put(chat_message)

        #    if isinstance(message, str) and message.startswith("ping"):
        #        self.datachannel.send('pong' + message[4:])

        #@self.pc.on("datachannel")
        #def on_datachannel(channel):
        #    @channel.on("message")
        #    async def on_message(message):
        #        logging.info('Client {} received message: {}'.format(self.id, message))
        #        #chat_message = ChatMessage(message)
        #        #if chat_message.sender is None:
        #        #    chat_message.sender = self.id
        #        #await self.messageq.put(chat_message)

        #        #if isinstance(message, str) and message.startswith("ping"):
        #        #self.datachannel.send('pong' + message[4:])

        return self.pc

    async def setup_peer_connection(self, sdp=None):
        logging.info('Setup peer connection')
        if sdp is None:
            sdp = self.sdp

        offer = RTCSessionDescription(sdp=sdp, type='offer')
        await self.pc.setRemoteDescription(offer)

        answer = await self.pc.createAnswer()
        await self.pc.setLocalDescription(answer)

        #return json.dumps({"sdp": self.pc.localDescription.sdp, "type": self.pc.localDescription.type})
        return {"sdp": self.pc.localDescription.sdp, "type": self.pc.localDescription.type}

    def send(self, data):
        # send data over peerconnection data channel
        logging.info('ChatClient.send({})'.format(data))
        self.datachannel.send(data)

    async def receive(self):
        return await self.messageq.get()

    def message_available(self):
        return self.messageq.qsize() > 0

    async def disconnect(self):
        pass

class ChatMessage:
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
        return json.dumps(self.__dict__)

#class ChatMessageHandler:
#    def __init__(self, client):
#        self.client = client
#
#    async def run(self):
#        while True:
#            message = await client.receive()
#
#    async def handle(self):
#        pass
#
#    async def bar(self, coro):
#        #e.g. coro = foo
#        while True:
#            result, coro = await coro
#            await handle_result(result)
#
#    async def foo(self):
#        f = client.receive
#        return (await f(), f())
#
#    async def run(self, coro):
#        [result for result, coro in await coro]
#
#
#    async def make_coro(self, coro):
#        return await coro, coro
#
#
#class RecurringTask:
#    def __init__(self, f):
#        self.f = f
#

class ChatManager:
    def __init__(self):
        logging.info('Create ChatManager')
        self.rooms = {}
        self.clients = {}
        self._stop = False
        self._message_forwarder_task = None
        self._message_address = "ground control"

        logging.info('Done creating ChatManager')

    def _handle_message(self, message, client, channel):
        chat_message = self._parse_message(message, client)

        if chat_message.receiver == self._message_address:
            self._handle_local_message(chat_message, client, channel)
            return

        if chat_message.receiver not in self.clients:
            logging.info('Message recipient does not exist for message: {}'.format(chat_message.json))
            # TODO: reply with error
            return

        logging.info('Sending message to client {}'.format(to_client))
        to_client = self.clients[chat_message.receiver]
        to_client.send(chat_message.json())

    def _handle_local_message(self, message, client, channel):
        reply = ChatMessage()
        reply.sender = self._message_address
        reply.receiver = client.id

        if message.type == 'ping':
            reply.type = 'pong'
            reply.data = message.data
        elif message.type == 'get-clients':
            reply.type = message.type
            reply.data = self._list_clients()
        elif message.type == 'get-room-info':
            reply.type = message.type
            reply.data = self._get_room_info(client.room.id)
        elif message.type == 'greeting':
            logging.info('Greeting received from client {}: {}'.format(message.sender, message.data))
            return
        else:
            reply.type = 'error'
            reply.data = 'Unknown message type: {}'.format(message.type)

        logging.info('Sending response: {}'.format(reply.json()))
        channel.send(reply.json())
        #client.send('pong')
        #client.send(reply.json())

    def _parse_message(self, message, client):
        chat_message = ChatMessage(message)
        if chat_message.sender is None:
            chat_message.sender = client.id
        return chat_message

    def _list_clients(self):
        return [client.id for client in self.clients.values()]

    def _get_room_info(self, room_id):
        room = self.rooms[room_id]
        clients = [client.id for client in room.get_clients()]

        return {'room_id': room_id, 'clients': clients}

    def add_room(self, room):
        self.rooms[room.id] = room

    def add_client(self, client):
        @client.pc.on("datachannel")
        async def on_datachannel(channel):
            logging.info('Sending greeting to client {}'.format(client.id))
            greeting = ChatMessage()
            greeting.sender = self._message_address
            greeting.receiver = client.id
            greeting.type = 'greeting'
            greeting.data = 'This is Ground Control to Major Tom: You\'ve really made the grade. Now it\'s time to leave the capsule if you dare.'
            #channel.send('greetings')
            channel.send(greeting.json())

            @channel.on("message")
            def on_message(message):
                logging.info('Received message: {}'.format(message))
                #logging.info('{} // {}'.format(id(channel), id(client.datachannel)))
                #if isinstance(message, str) and message.startswith("ping"):
                #channel.send('pong' + message[4:])
                self._handle_message(message, client, channel)

        self.clients[client.id] = client

    def get_room(self, room_id):
        return self.rooms.get(room_id)

    def create_room(self, room_id):
        if room_id in self.rooms:
            raise ChatManagerException('Room {} already exists'.format(room_id))

        room = ChatRoom(room_id)
        self.add_room(room)

        return room

    def create_client(self, client_id=None):
        logging.info('create_client()')

        if client_id is None:
            client_id = uuid.uuid4().hex

        if client_id in self.clients:
            raise ChatManagerException('Client {} already exists'.format(room_id))

        client = ChatClient(client_id)
        self.add_client(client)

        return client

    def get_or_create_room(self, room_id):
        if room_id in self.rooms:
            return self.rooms[room_id]

        return self.create_room(room_id)

    def get_or_create_client(self, client_id):
        if client_id in self.clients:
            return self.clients[client_id]

        return self.create_client(client_id)

    def enter_room(self, client, room):
        client.room = room
        room.add_client(client)

        ## remove/
        if room_id not in self.rooms:
            raise ChatManagerException('Room {} doesn\'t exist'.format(room_id))

        if client_id not in self.clients:
            self.clients[client_id] = ChatClient(client_id)

        client = self.clients[client_id]
        self.rooms[room_id].add(client)
        ## /remove

    async def leave_room(self, client_id, room_id):
        if room_id not in self.rooms:
            raise ChatManagerException('Room {} doesn\'t exist'.format(room_id))

        if client_id not in self.clients:
            raise ChatManagerException('Client {} doesn\'t exist'.format(client_id))

        # TODO
        pass



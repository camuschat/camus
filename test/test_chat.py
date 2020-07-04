import uuid

import pytest

from camus.chat import ChatClient, ChatManager, ChatRoom, get_chat_manager

pytestmark = pytest.mark.asyncio

def test_get_chat_manager():
    assert get_chat_manager() is not None

class TestChatRoom:
    async def test_add_client(self):
        client_id = uuid.uuid4().hex
        client = ChatClient(client_id)
        room = ChatRoom('junk')
        room.add_client(client)
        assert client_id in room.clients
        assert client in room.clients.values()

    async def test_remove_client(self):
        client_id = uuid.uuid4().hex
        client = ChatClient(client_id)
        room = ChatRoom('garbage')
        room.add_client(client)
        room.remove_client(client)
        assert client_id not in room.clients
        assert client not in room.clients.values()

    async def test_get_clients(self):
        client1 = ChatClient(uuid.uuid4().hex)
        client2 = ChatClient(uuid.uuid4().hex)
        room = ChatRoom('trash')
        room.add_client(client1)
        room.add_client(client2)
        clients = room.get_clients()
        assert client1 in clients
        assert client2 in clients

    async def test_info(self):
        client_id = uuid.uuid4().hex
        client_username = 'Mr. Bill'
        client = ChatClient(client_id, username=client_username)
        room_id = 'sludge'
        room = ChatRoom(room_id)
        room.add_client(client)
        room_info = room.info
        assert 'room_id' in room_info
        assert 'clients' in room_info
        assert room_info['room_id'] == room_id
        assert client_id in [item['id'] for item in room_info['clients']]
        assert client_username in [item['username'] for item in room_info['clients']]

    async def test_is_full(self):
        client1 = ChatClient(uuid.uuid4().hex)
        client2 = ChatClient(uuid.uuid4().hex)
        room = ChatRoom('clutter', guest_limit=2)
        room.add_client(client1)
        room.add_client(client2)
        assert room.is_full()

        room = ChatRoom('debris', guest_limit=None)
        room.add_client(client1)
        room.add_client(client2)
        assert not room.is_full()

class TestChatManager:
    async def test_add_room(self):
        manager = get_chat_manager()
        room = ChatRoom('waste')
        manager.add_room(room)
        assert room.id in manager.rooms

    async def test_create_client(self):
        manager = get_chat_manager()
        client = manager.create_client()
        assert client is not None
        assert client.id is not None

        client_id = uuid.uuid4().hex
        client = manager.create_client(client_id)
        assert client is not None
        assert client.id == client_id

    async def test_create_room(self):
        manager = get_chat_manager()
        room_id = uuid.uuid4().hex
        room = manager.create_room(room_id)
        assert room is not None
        assert room.id == room_id
        assert room_id in manager.rooms
        assert manager.rooms[room_id] == room

    async def test_remove_client(self):
        manager = get_chat_manager()
        client = manager.create_client()
        room = manager.create_room('rubbish')
        room.add_client(client)
        await manager.remove_client(client)
        assert client.id not in manager.clients
        assert client not in manager.clients.values()

    async def test_get_room(self):
        manager = get_chat_manager()
        room = manager.create_room('refuse')
        got_room = manager.get_room(room.id)
        assert room == got_room

    async def test_get_public_rooms(self):
        manager = get_chat_manager()
        public_room = manager.create_room('public', is_public=True)
        assert public_room in manager.get_public_rooms()

        private_room = manager.create_room('private', is_public=False)
        assert private_room not in manager.get_public_rooms()

import asyncio
import json

import pytest

from camus import db
from camus.message_handler import Message
from camus.models import Client, Room


@pytest.mark.asyncio
async def test_inbox_ping(app, message_handler):
    async with app.app_context():
        _, sender_uuid, _ = await _seed_db(app)

        # Send ping
        data = json.dumps({
            'type': 'ping',
            'sender': sender_uuid,
            'receiver': 'ground control',
            'data': '9999'
        })
        message_handler.inbox.put_nowait((sender_uuid, data))

        # Expect pong
        await asyncio.sleep(0)
        msg = json.loads(message_handler.outbox[sender_uuid].get_nowait())
        assert msg['type'] == 'pong'


@pytest.mark.asyncio
async def test_inbox_profile(app, message_handler):
    async with app.app_context():
        _, sender_uuid, _ = await _seed_db(app)

        # Send profile
        data = json.dumps({
            'type': 'profile',
            'sender': sender_uuid,
            'receiver': 'ground control',
            'data': {
                'username': 'Coconut'
            }
        })
        message_handler.inbox.put_nowait((sender_uuid, data))

        # Expect room-info
        await asyncio.sleep(0)
        msg = json.loads(message_handler.outbox[sender_uuid].get_nowait())
        assert msg['type'] == 'room-info'


@pytest.mark.asyncio
async def test_inbox_get_room_info(app, message_handler):
    async with app.app_context():
        _, sender_uuid, _ = await _seed_db(app)

        # Send get-room-info
        data = json.dumps({
            'type': 'get-room-info',
            'sender': sender_uuid,
            'receiver': 'ground control'
        })
        message_handler.inbox.put_nowait((sender_uuid, data))

        # Expect room-info
        await asyncio.sleep(0)
        msg = json.loads(message_handler.outbox[sender_uuid].get_nowait())
        assert msg['type'] == 'room-info'


@pytest.mark.asyncio
async def test_inbox_get_ice_servers(app, message_handler):
    async with app.app_context():
        _, sender_uuid, _ = await _seed_db(app)

        # Send get-room-info
        data = json.dumps({
            'type': 'get-ice-servers',
            'sender': sender_uuid,
            'receiver': 'ground control'
        })
        message_handler.inbox.put_nowait((sender_uuid, data))

        # Expect room-info
        await asyncio.sleep(0)
        msg = json.loads(message_handler.outbox[sender_uuid].get_nowait())
        assert msg['type'] == 'ice-servers'


@pytest.mark.asyncio
async def test_inbox_text(app, message_handler):
    async with app.app_context():
        _, sender_uuid, receiver_uuid = await _seed_db(app)

        # Send text
        data = json.dumps({
            'type': 'text',
            'sender': sender_uuid,
            'receiver': receiver_uuid,
            'data': {
                'from': 'Coconut',
                'time': '9999',
                'text': 'Message consisting of text.'
            }
        })
        message_handler.inbox.put_nowait((sender_uuid, data))

        # Expect text
        await asyncio.sleep(0)
        msg = json.loads(message_handler.outbox[receiver_uuid].get_nowait())
        assert msg['type'] == 'text'


@pytest.mark.asyncio
async def test_broadcast(app, message_handler):
    async with app.app_context():
        room_slug, client1_uuid, client2_uuid = await _seed_db(app)
        room = Room.query.filter_by(slug=room_slug).first()

        # Send text
        message = Message({
            'type': 'ping',
            'sender': client1_uuid,
            'receiver': 'room'
        })
        message_handler.broadcast(room, message)

        # Each client should receive the message
        await asyncio.sleep(0)
        msg1 = json.loads(message_handler.outbox[client1_uuid].get_nowait())
        msg2 = json.loads(message_handler.outbox[client2_uuid].get_nowait())
        assert msg1['type'] == 'ping' and msg2['type'] == 'ping'


@pytest.mark.asyncio
async def test_send_ping(message_handler):
    message_handler.send_ping('1234')
    msg = json.loads(message_handler.outbox['1234'].get_nowait())
    assert msg['type'] == 'ping'


@pytest.mark.asyncio
async def test_send_bye(message_handler):
    message_handler.send_bye('1234')
    msg = json.loads(message_handler.outbox['1234'].get_nowait())
    assert msg['type'] == 'bye'


async def _seed_db(app):
    """Seed the database with a room and clients."""
    async with app.app_context():
        room = Room()
        room.set_name('TestRoom123')
        room_slug = room.slug
        client1 = Client(uuid='1234', room=room)
        client2 = Client(uuid='5678', room=room)
        client1_uuid = client1.uuid
        client2_uuid = client2.uuid
        db.session.add_all([room, client1, client2])
        db.session.commit()

    return room_slug, client1_uuid, client2_uuid

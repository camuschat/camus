import json

import pytest

from quart import session
from quart.testing.connections import WebsocketResponse

from camus import db, message_handler
from camus.models import Client, Room


@pytest.mark.asyncio
async def test_index(client):
    response = await client.get('/')
    assert response.status_code == 200

    data = await response.get_data()
    assert b'Create a room' in data


@pytest.mark.asyncio
async def test_public(client):
    response = await client.get('/public')
    assert response.status_code == 200

    data = await response.get_data()
    assert b'Public rooms' in data


@pytest.mark.asyncio
async def test_enter_room(client):
    async with client.app.app_context():
        # Create a room
        room = Room()
        room.set_name('My room')
        db.session.add(room)
        db.session.commit()

        # Enter the room
        response = await client.get(f'/room/{room.slug}')

    assert response.status_code == 200

    data = await response.get_data()
    assert b'My room' in data
    assert b'react-root' in data


@pytest.mark.asyncio
async def test_enter_room_with_password(client):
    async with client.app.app_context():
        # Create a room
        room = Room()
        room.set_name('My password-protected room')
        room.set_password('cat')
        db.session.add(room)
        db.session.commit()

        # Enter the room
        response = await client.post(f'/room/{room.slug}', json={
            'password': 'cat'
        })

    assert response.status_code == 200

    data = await response.get_data()
    assert b'My password-protected room' in data
    assert b'react-root' in data


@pytest.mark.asyncio
async def test_enter_room_with_wrong_password(client):
    async with client.app.app_context():
        # Create a room
        room = Room()
        room.set_name('My password-protected room')
        room.set_password('cat')
        db.session.add(room)
        db.session.commit()

        # Attempt to enter the room
        response = await client.post(f'/room/{room.slug}', json={
            'password': 'dog'
        })

    assert response.status_code == 401

    data = await response.get_data()
    assert b'react-root' not in data


@pytest.mark.asyncio
async def test_enter_room_with_guest_limit(client):
    async with client.app.app_context():
        # Create a room
        room = Room(guest_limit=2)
        room.set_name('My small room')
        db.session.add(room)
        db.session.commit()

        # Enter the room
        response = await client.get(f'/room/{room.slug}')

    assert response.status_code == 200

    data = await response.get_data()
    assert b'My small room' in data
    assert b'react-root' in data


@pytest.mark.asyncio
async def test_enter_full_room_with_guest_limit(client):
    async with client.app.app_context():
        # Create a room
        room = Room(guest_limit=2)
        room.set_name('My full small room')
        client1 = Client(uuid='1234', room=room)
        client2 = Client(uuid='5678', room=room)
        db.session.add_all([room, client1, client2])
        db.session.commit()

        # Attempt to enter the room
        response = await client.get(f'/room/{room.slug}')

    assert response.status_code == 418

    data = await response.get_data()
    assert b'Guest limit already reached' in data


@pytest.mark.asyncio
async def test_create_default_room(client):
    data = await _create_room(client, 'Default room')

    # We should be redirected to the room
    assert 'Default room' in data
    assert 'react-root' in data


@pytest.mark.asyncio
async def test_create_public_room(client):
    data = await _create_room(client, 'Public room', public='Yes')

    # We should be redirected to the room
    assert 'Public room' in data
    assert 'react-root' in data


@pytest.mark.asyncio
async def test_create_password_protected_room(client):
    data = await _create_room(client, 'Password room', password='cat')

    # We should be redirected to the room
    assert 'Password room' in data
    assert 'react-root' in data


@pytest.mark.asyncio
async def test_create_room_with_guest_limit(client):
    data = await _create_room(client, 'Password room', guest_limit='2')

    # We should be redirected to the room
    assert 'Password room' in data
    assert 'react-root' in data


@pytest.mark.asyncio
async def test_websocket(client):
    async with client.app.app_context():
        message_handler.start()

        # Create a room
        room = Room()
        room.set_name('My room')
        db.session.add(room)
        db.session.commit()

        # Enter the room to set cookie for websocket auth
        async with client:
            await client.get(f'/room/{room.slug}')
            assert session.get('id', None) is not None

        # Connect to the websocket and send a ping
        async with client.websocket(f'/room/{room.slug}/ws') as ws:
            await ws.send(json.dumps({
                'type': 'ping',
                'sender': '1234',
                'receiver': 'ground control',
                'data': '9999'
            }))
            response = await ws.receive()

            assert ws.accepted
            assert 'pong' in response

        message_handler.stop()


@pytest.mark.asyncio
async def test_websocket_without_entering_room(client):
    async with client.app.app_context():
        message_handler.start()

        # Create a room
        room = Room()
        room.set_name('My room')
        db.session.add(room)
        db.session.commit()

        # Attempt to connect to the websocket (without entering room first)
        async with client.websocket(f'/room/{room.slug}/ws') as ws:
            with pytest.raises(WebsocketResponse) as err:
                await ws.send(json.dumps({
                    'type': 'ping',
                    'sender': '1234',
                    'receiver': 'ground control',
                    'data': '9999'
                }))
                await ws.receive()

            assert not ws.accepted
            assert err.value.response.status_code == 403

        message_handler.stop()


async def _create_room(client, name, password='', public='No', guest_limit='0'):
    response = await client.post('/', json={
        'room_name': name,
        'password': password,
        'public': public,
        'guest_limit': guest_limit
    }, follow_redirects=True)
    return (await response.get_data()).decode()

import pytest

from camus import db
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
    room = Room()
    room.set_name('My room')

    async with client.app.app_context():
        db.session.add(room)
        db.session.commit()

        response = await client.get(f'/room/{room.slug}')

    assert response.status_code == 200

    data = await response.get_data()
    assert b'My room' in data
    assert b'react-root' in data


@pytest.mark.asyncio
async def test_enter_room_with_password(client):
    room = Room()
    room.set_name('My password-protected room')
    room.set_password('cat')

    async with client.app.app_context():
        db.session.add(room)
        db.session.commit()

        response = await client.post(f'/room/{room.slug}', json={
            'password': 'cat'
        })

    assert response.status_code == 200

    data = await response.get_data()
    assert b'My password-protected room' in data
    assert b'react-root' in data


@pytest.mark.asyncio
async def test_enter_room_with_wrong_password(client):
    room = Room()
    room.set_name('My password-protected room')
    room.set_password('cat')

    async with client.app.app_context():
        db.session.add(room)
        db.session.commit()

        response = await client.post(f'/room/{room.slug}', json={
            'password': 'dog'
        })

    assert response.status_code == 401

    data = await response.get_data()
    assert b'react-root' not in data


@pytest.mark.asyncio
async def test_enter_room_with_guest_limit(client):
    room = Room(guest_limit=2)
    room.set_name('My small room')

    async with client.app.app_context():
        db.session.add(room)
        db.session.commit()

        response = await client.get(f'/room/{room.slug}')

    assert response.status_code == 200

    data = await response.get_data()
    assert b'My small room' in data
    assert b'react-root' in data


@pytest.mark.asyncio
async def test_enter_full_room_with_guest_limit(client):
    room = Room(guest_limit=2)
    room.set_name('My full small room')
    client1 = Client(uuid='1234', room=room)
    client2 = Client(uuid='5678', room=room)

    async with client.app.app_context():
        db.session.add_all([room, client1, client2])
        db.session.commit()

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


async def _create_room(client, name, password='', public='No', guest_limit='0'):
    response = await client.post('/', json={
        'room_name': name,
        'password': password,
        'public': public,
        'guest_limit': guest_limit
    }, follow_redirects=True)
    return (await response.get_data()).decode()

import pytest

from camus.models import Room


@pytest.mark.asyncio
async def test_room_set_name():
    room = Room()
    room.set_name('My Room')
    assert room.name == 'My Room'
    assert room.slug == 'my-room'


@pytest.mark.asyncio
async def test_room_set_password():
    room = Room()
    room.set_password('cat')
    assert room.password_hash is not None


@pytest.mark.asyncio
async def test_room_no_authentication():
    room = Room()
    assert room.authenticate()


@pytest.mark.asyncio
async def test_room_authentication():
    room = Room()
    room.set_password('cat')
    assert room.authenticate('cat')


@pytest.mark.asyncio
async def test_room_failed_authentication():
    room = Room()
    room.set_password('cat')
    assert not room.authenticate()
    assert not room.authenticate('dog')

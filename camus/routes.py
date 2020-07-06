import asyncio

from quart import (copy_current_websocket_context, flash, jsonify, redirect, render_template,
                   request, websocket)

from camus import app
from camus.forms import RoomCreate, RoomJoin

from camus import chat
from camus.chat import ChatException


@app.route('/')
@app.route('/index')
async def index():
    return redirect('/chat')

@app.route('/about')
async def about():
    return await render_template('about.html', title='Camus Video Chat | About')

@app.route('/chat', methods=['GET', 'POST'])
async def chat_create():
    manager = chat.get_chat_manager()

    form_create = RoomCreate()
    if form_create.validate_on_submit():
        form = form_create
        room_name = form.room_name.data
        password = None if not len(form.password.data) else form.password.data
        is_public = form.public.data
        guest_limit = None if form.guest_limit.data == 0 else form.guest_limit.data
        admin_list = []

        try:
            room = manager.create_room(room_name, password=password, guest_limit=guest_limit,
                                       admin_list=admin_list, is_public=is_public)
            return redirect('/chat/{}'.format(room.id))
        except ChatException as e:
            await flash('Room name not available')

    form_join = RoomJoin()
    public_rooms = manager.get_public_rooms()
    return await render_template('chat.html', form_create=form_create,
                                 form_join=form_join, public_rooms=public_rooms)


@app.route('/chat/<room_id>', methods=['GET', 'POST'])
async def chat_room(room_id):
    manager = chat.get_chat_manager()
    room = manager.get_room(room_id)

    if room is None:
        return '404', 404

    if room.is_full():
        return 'Guest limit already reached', 418

    if room.authenticate():  # i.e. a password is not required
        return await render_template('chatroom.html', title='Camus | {}'.format(room.name))

    form = RoomJoin()
    if form.validate_on_submit():
        room_id = form.room_id.data
        password = form.password.data

        if room.authenticate(password):
            # TODO: Generate token to be used with offer
            return await render_template('chatroom.html', title='Camus | {}'.format(room.name))
        else:
            await flash('Invalid password')

    return await render_template('join-room.html', title='Camus | Join a room', form=form, room_id=room_id)


@app.websocket('/chat/<room_id>/ws')
async def chat_room_ws(room_id):
    manager = chat.get_chat_manager()
    room = manager.get_room(room_id)

    if room is None:
        return # close the websocket

    client = manager.create_client()
    room.add_client(client)

    send_task = asyncio.create_task(
        copy_current_websocket_context(ws_send)(client.outbox),
    )
    receive_task = asyncio.create_task(
        copy_current_websocket_context(ws_receive)(client.inbox),
    )
    try:
        await asyncio.gather(send_task, receive_task)
    finally:
        send_task.cancel()
        receive_task.cancel()


async def ws_send(queue):
    while True:
        message = await queue.get()
        await websocket.send(message)


async def ws_receive(queue):
    while True:
        message = await websocket.receive()
        await queue.put(message)

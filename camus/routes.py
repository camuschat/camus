import asyncio

from quart import (copy_current_websocket_context, flash, redirect,
                   render_template, websocket)

from camus import app
from camus.forms import CreateRoomForm, JoinRoomForm

from camus import chat
from camus.chat import ChatException


@app.route('/')
@app.route('/index')
async def index():
    return redirect('/chat')


@app.route('/about')
async def about():
    return redirect('/chat#why-camus')


@app.route('/chat', methods=['GET', 'POST'])
async def chat_create():
    manager = chat.get_chat_manager()

    create_room_form = CreateRoomForm()
    if create_room_form.validate_on_submit():
        form = create_room_form
        room_name = form.room_name.data
        password = None if not len(form.password.data) else form.password.data
        is_public = form.public.data
        guest_limit = (None if form.guest_limit.data == 0
                       else form.guest_limit.data)
        admin_list = []

        try:
            room = manager.create_room(
                room_name, password=password, guest_limit=guest_limit,
                admin_list=admin_list, is_public=is_public)
            return redirect('/chat/{}'.format(room.id), code=307)
        except ChatException:
            await flash('The room name "{}" is not available'
                        .format(room_name))

    form_join = JoinRoomForm()
    public_rooms = manager.get_public_rooms()
    return await render_template(
        'chat.html', create_room_form=create_room_form, form_join=form_join,
        public_rooms=public_rooms)


@app.route('/chat/<room_id>', methods=['GET', 'POST'])
async def chat_room(room_id):
    manager = chat.get_chat_manager()
    room = manager.get_room(room_id)

    if room is None:
        return '404', 404

    if room.is_full():
        return 'Guest limit already reached', 418

    if room.authenticate():  # i.e. a password is not required
        return await render_template(
            'chatroom.html', title='Camus | {}'.format(room.name))

    form = JoinRoomForm()
    if form.validate_on_submit():
        password = form.password.data

        if room.authenticate(password):
            # TODO: Generate token to be used with websocket
            return await render_template(
                'chatroom.html', title='Camus | {}'.format(room.name))
        await flash('Invalid password')

    return await render_template(
        'join-room.html', title='Camus | Join a room', form=form, room=room)


@app.websocket('/chat/<room_id>/ws')
async def chat_room_ws(room_id):
    manager = chat.get_chat_manager()
    room = manager.get_room(room_id)

    if room is None:
        return  # close the websocket

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


@app.route('/public')
async def public():
    manager = chat.get_chat_manager()
    public_rooms = manager.get_public_rooms()

    return await render_template(
        'public.html', title='Camus Video Chat | Public Rooms',
        public_rooms=public_rooms)


async def ws_send(queue):
    while True:
        message = await queue.get()
        await websocket.send(message)


async def ws_receive(queue):
    while True:
        message = await websocket.receive()
        await queue.put(message)

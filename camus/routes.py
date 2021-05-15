import asyncio
import logging

import sqlalchemy
from quart import (Blueprint, copy_current_websocket_context, flash, redirect,
                   render_template, session, websocket)

from camus import db, message_handler
from camus.forms import CreateRoomForm, JoinRoomForm
from camus.models import Client, Room
from camus.util import commit_database

bp = Blueprint('main', __name__)


@bp.route('/about')
async def about():
    return redirect('/#why-camus')


@bp.route('/', methods=['GET', 'POST'])
async def index():
    create_room_form = CreateRoomForm()
    if create_room_form.validate_on_submit():
        form = create_room_form
        name = form.room_name.data
        password = form.password.data
        is_public = form.public.data
        guest_limit = form.guest_limit.data

        try:
            room = Room(guest_limit=guest_limit, is_public=is_public)
            room.set_name(name)
            if password:
                room.set_password(password)
            db.session.add(room)
            commit_database(reraise=True)

            return redirect('/room/{}'.format(room.slug), code=307)
        except sqlalchemy.exc.IntegrityError:
            await flash('The room name "{}" is not available'.format(name))

    return await render_template(
        'chat.html', create_room_form=create_room_form)


# The `/chat` route is deprecated.
@bp.route('/chat')
async def chat_index():
    return redirect('/', code=307)


# The `/chat/` route is deprecated. Prefer`/room/` instead.
@bp.route('/chat/<room_id>', methods=['GET', 'POST'])
@bp.route('/room/<room_id>', methods=['GET', 'POST'])
async def room(room_id):
    room = Room.query.filter_by(slug=room_id).first_or_404()

    if room.is_full():
        return 'Guest limit already reached', 418

    # No password is required to join the room
    client = room.authenticate()
    if client:
        db.session.add(client)
        commit_database(reraise=True)
        session['id'] = client.uuid

        return await render_template(
            'chatroom.html', title='Camus | {}'.format(room.name))

    # A password is required to join the room
    status_code = 200
    form = JoinRoomForm()
    if form.validate_on_submit():
        password = form.password.data

        client = room.authenticate(password)
        if client:
            db.session.add(client)
            commit_database(reraise=True)
            session['id'] = client.uuid

            return await render_template(
                'chatroom.html', title='Camus | {}'.format(room.name))

        # Authentication failed
        status_code = 401
        await flash('Invalid password')

    return (
        (await render_template('join-room.html', title='Camus | Join a room',
                               form=form, room=room)),
        status_code)


# The `/chat/` route is deprecated. Prefer`/room/` instead.
@bp.websocket('/chat/<room_id>/ws')
@bp.websocket('/room/<room_id>/ws')
async def room_ws(room_id):
    # Verify that the room exists
    Room.query.filter_by(slug=room_id).first_or_404()

    # Verify the client using a secure cookie
    client = Client.query.filter_by(uuid=session.get('id', None)).first()
    if client:
        logging.info(f'Accepted websocket connection for client {client.uuid}')
        await websocket.accept()
    else:
        return 'Forbidden', 403

    inbox, outbox = message_handler.inbox, message_handler.outbox

    send_task = asyncio.create_task(
        copy_current_websocket_context(ws_send)(outbox[client.uuid]),
    )
    receive_task = asyncio.create_task(
        copy_current_websocket_context(ws_receive)(client.uuid, inbox),
    )
    try:
        await asyncio.gather(send_task, receive_task)
    finally:
        logging.info(f'Terminating websocket connection for client {client.uuid}')
        send_task.cancel()
        receive_task.cancel()


@bp.route('/public')
async def public():
    public_rooms = Room.query.filter_by(is_public=True).all()

    return await render_template(
        'public.html', title='Camus Video Chat | Public Rooms',
        public_rooms=public_rooms)


async def ws_send(queue):
    while True:
        message = await queue.get()
        await websocket.send(message)


async def ws_receive(client_id, queue):
    while True:
        message = await websocket.receive()
        await queue.put((client_id, message))

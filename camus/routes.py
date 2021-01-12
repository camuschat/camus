import asyncio
import uuid

import sqlalchemy
from quart import (Blueprint, copy_current_websocket_context, flash, redirect,
                   render_template, websocket)

from camus import db
from camus.forms import CreateRoomForm, JoinRoomForm
from camus.message_handler import get_message_handler
from camus.models import Client, Room

bp = Blueprint('main', __name__)


@bp.route('/about')
async def about():
    return redirect('/#why-camus')


@bp.route('/', methods=['GET', 'POST'])
async def chat_create():
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
            db.session.commit()

            return redirect('/room/{}'.format(room.slug), code=307)
        except sqlalchemy.exc.IntegrityError:
            await flash('The room name "{}" is not available'.format(name))

    return await render_template(
        'chat.html', create_room_form=create_room_form)


@bp.route('/room/<room_id>', methods=['GET', 'POST'])
async def chat_room(room_id):
    room = Room.query.filter_by(slug=room_id).first_or_404()

    if room.is_full():
        return 'Guest limit already reached', 418

    if room.authenticate():  # i.e. a password is not required
        return await render_template(
            'chatroom.html', title='Camus | {}'.format(room.name))

    # A password is required to join the room
    status_code = 200
    form = JoinRoomForm()
    if form.validate_on_submit():
        password = form.password.data

        if room.authenticate(password):
            # TODO: Generate token to be used with websocket
            return await render_template(
                'chatroom.html', title='Camus | {}'.format(room.name))

        # Authentication failed
        status_code = 401
        await flash('Invalid password')

    return (
        (await render_template('join-room.html', title='Camus | Join a room',
                               form=form, room=room)),
        status_code)


@bp.websocket('/room/<room_id>/ws')
async def chat_room_ws(room_id):
    message_handler = get_message_handler()
    inbox, outbox = message_handler.inbox, message_handler.outbox

    room = Room.query.filter_by(slug=room_id).first()
    if room is None:
        return  # close the websocket

    client = Client(uuid=uuid.uuid4().hex, room=room)
    db.session.add(client)
    db.session.commit()

    send_task = asyncio.create_task(
        copy_current_websocket_context(ws_send)(outbox[client.uuid]),
    )
    receive_task = asyncio.create_task(
        copy_current_websocket_context(ws_receive)(client.uuid, inbox),
    )
    try:
        await asyncio.gather(send_task, receive_task)
    finally:
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

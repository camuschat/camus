import asyncio
import logging

from aiortc.contrib.media import MediaBlackhole, MediaPlayer, MediaRecorder

from quart import flash, jsonify, redirect, render_template, request, url_for, send_from_directory, session
from werkzeug.urls import url_parse

from app import app
from app.forms import RoomCreate, RoomJoin

from app import chat


@app.route('/')
@app.route('/index')
async def index():
    return await render_template('index.html')


@app.route('/reset')
async def reset():
    if 'client_id' in session:
        del session['client_id']

    return redirect(url_for('rtc'))


@app.route('/rtc', methods=['GET', 'POST'])
async def rtc():
    manager, client, room = await get_chat_info()

    #if room is not None:
    #    return redirect('/rtc/{}'.format(room.id))

    form_create = RoomCreate()
    if form_create.validate_on_submit():
        form = form_create
        room_id = form.room_id.data
        password = None if not len(form.password.data) else form.password.data
        is_public = form.public.data
        guest_limit = None if form.guest_limit.data == 0 else form.guest_limit.data
        admin_list = [client.id]
        manager.create_room(room_id, password=password, guest_limit=guest_limit,
                            admin_list=admin_list, is_public=is_public)
        return redirect('/rtc/{}'.format(room_id))

    form_join = RoomJoin()
    if form_join.validate_on_submit():
        form = form_join
        room_id = form.room_id.data
        password = form.password.data
        # TODO: verify password
        return redirect('/rtc/{}'.format(room_id))

    public_rooms = manager.get_public_rooms()
    return await render_template('rtc.html', title='rtc', form_create=form_create,
                                 form_join=form_join, public_rooms=public_rooms)


@app.route('/rtc/<room_id>', methods=['GET', 'POST'])
async def rtc_room(room_id):
    manager, client, _ = await get_chat_info()
    room = manager.get_room(room_id)

    if room is None:
        return '404', 404

    #manager, client, _ = await get_chat_info()

    if request.method == 'GET':
        client.enter_room(room)
        return await render_template('rtcroom.html', title='rtc', room=room)

    params = await request.json
    if params['type'] == 'offer':
        sdp = params['sdp']
        client.sdp = sdp
        #await client.create_peer_connection()
        answer = await client.setup_peer_connection()
        return jsonify(answer)

    if params['type'] == 'icecandidate':
        return '404', 404


async def get_chat_info():
    client_id = session.get('client_id')
    manager = await chat.get_chat_manager()
    client = manager.get_or_create_client(client_id)
    room = client.room
    session['client_id'] = client.id

    return manager, client, room

async def handle_message(message):
    manager, client, room = await get_chat_info()


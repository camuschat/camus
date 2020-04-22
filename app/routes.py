import asyncio
import logging

from aiortc.contrib.media import MediaBlackhole, MediaPlayer, MediaRecorder

from quart import flash, jsonify, redirect, render_template, request, url_for, send_from_directory, session
from werkzeug.urls import url_parse

from app import app
from app.forms import RtcForm

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

    if room is not None:
        return redirect('/rtc/{}'.format(room.id))

    form = RtcForm()
    if form.validate_on_submit():
        room_id = form.room_id.data
        manager.get_or_create_room(room_id)
        return redirect('/rtc/{}'.format(room_id))

    return await render_template('rtc.html', title='rtc', form=form)


@app.route('/rtc/<room_id>', methods=['GET', 'POST'])
async def rtc_room(room_id):
    manager, client, _ = await get_chat_info()
    room = manager.get_room(room_id)

    if room is None:
        return '404', 404

    if request.method == 'GET':
        client.enter_room(room)
        #room.
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


from quart import flash, jsonify, redirect, render_template, request

from camus import app
from camus.forms import RoomCreate, RoomJoin

from camus import chat
from camus.chat import ChatException


@app.route('/')
@app.route('/index')
async def index():
    return await render_template('index.html')


@app.route('/rtc', methods=['GET', 'POST'])
async def rtc():
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
            return redirect('/rtc/{}'.format(room.id))
        except ChatException as e:
            await flash('Room name not available')

    form_join = RoomJoin()
    public_rooms = manager.get_public_rooms()
    return await render_template('rtc.html', title='rtc', form_create=form_create,
                                 form_join=form_join, public_rooms=public_rooms)


@app.route('/rtc/<room_id>', methods=['GET', 'POST'])
async def rtc_room(room_id):
    manager = chat.get_chat_manager()
    room = manager.get_room(room_id)

    if room is None:
        return '404', 404

    if room.is_full():
        return 'Guest limit already reached', 418

    if room.authenticate():  # i.e. a password is not required
        return await render_template('rtcroom.html', title='rtc')

    form = RoomJoin()
    if form.validate_on_submit():
        room_id = form.room_id.data
        password = form.password.data

        if room.authenticate(password):
            # TODO: Generate token to be used with offer
            return await render_template('rtcroom.html', title='rtc')
        else:
            await flash('Invalid password')

    return await render_template('join-room.html', title='Join a room', form=form, room_id=room_id)


@app.route('/rtc/<room_id>/offer', methods=['POST'])
async def rtc_room_offer(room_id):
    manager = chat.get_chat_manager()
    room = manager.get_room(room_id)

    if room is None:
        return 'Invalid room id', 404

    params = await request.json
    if params['type'] == 'offer':
        sdp = params['sdp']
        client = manager.create_client()
        room.add_client(client)
        answer = await client.setup_peer_connection(sdp)
        return jsonify(answer)

    if params['type'] == 'icecandidate':
        # TODO: support trickle ice
        return '404', 404

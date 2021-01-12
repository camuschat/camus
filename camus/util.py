import asyncio
import datetime
import logging
import hmac
import traceback
from base64 import b64encode
from time import time

from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioException, TwilioRestException

from quart import current_app

from camus import db
from camus.models import Client, Room


class LoopTimer:
    """Run a task repeatedly at spaced intervals.

    The provided callback function is called in a loop, which sleeps at the
    beginning of each iteration for the specified timeout period.
    """

    def __init__(self, timeout, callback, **kwargs):
        self._timeout = timeout
        self._callback = callback
        self._task = asyncio.create_task(self._run())
        self._kwargs = kwargs

    async def _run(self):
        while True:
            await asyncio.sleep(self._timeout)
            try:
                await self._callback(**self._kwargs)
            except Exception as e:
                logging.error(traceback.format_exc())

    def cancel(self):
        """Cancel the running task."""
        self._task.cancel()


async def ping_clients(message_handler):
    """Send a ping message to all clients which have not been seen recently
    enough.
    """

    now = datetime.datetime.utcnow()
    clients = Client.query.filter(Client.seen < now - datetime.timedelta(seconds=30)).all()
    logging.info('Ping clients: {}'.format(clients))

    for client in clients:
        message_handler.send_ping(client.uuid)


async def reap_clients(message_handler):
    """Remove all clients which have not been seen recently enough."""

    now = datetime.datetime.utcnow()
    clients = Client.query.filter(Client.seen < now - datetime.timedelta(seconds=90)).all()
    logging.info('Reap clients: {}'.format(clients))

    for client in clients:
        room = client.room
        message_handler.send_bye(client.uuid)
        db.session.delete(client)
        db.session.commit()
        message_handler.broadcast_room_info(room)


async def reap_rooms():
    """Remove all rooms that have been inactive for long enough."""

    now = datetime.datetime.utcnow()
    rooms = Room.query.filter(Room.active < now - datetime.timedelta(seconds=300)).all()
    logging.info('Reap rooms: {}'.format(rooms))

    for room in rooms:
        db.session.delete(room)
        db.session.commit()


def get_ice_servers(username):
    """Get a list of configured ICE servers."""

    stun_host = current_app.config['STUN_HOST']
    stun_port = current_app.config['STUN_PORT']
    stun_url = 'stun:{}:{}'.format(stun_host, stun_port)
    servers = [{'urls': [stun_url]}]

    turn_host = current_app.config['TURN_HOST']
    turn_port = current_app.config['TURN_PORT']
    turn_key = current_app.config['TURN_STATIC_AUTH_SECRET']

    if turn_host and turn_port and turn_key:
        turn_url = 'turn:{}:{}'.format(turn_host, turn_port)
        username, password = generate_turn_creds(turn_key, username)
        servers.append({
            'urls': [turn_url],
            'username': username,
            'credential': password
        })

    servers += get_twilio_ice_servers()

    return servers


def get_twilio_ice_servers():
    """Fetch a list of ICE servers provided by Twilio."""

    account_sid = current_app.config['TWILIO_ACCOUNT_SID']
    auth_token = current_app.config['TWILIO_AUTH_TOKEN']
    key_sid = current_app.config['TWILIO_KEY_SID']

    try:
        twilio = TwilioClient(key_sid, auth_token, account_sid)
        token = twilio.tokens.create()
        return token.ice_servers
    except (TwilioException, TwilioRestException):
        return []


def generate_turn_creds(key, username):
    """Generate TURN server credentials for a client."""

    expiration = int(time()) + 6 * 60 * 60  # creds expire after 6 hrs
    username = '{}:{}'.format(expiration, username)
    token = hmac.new(key.encode(), msg=username.encode(), digestmod='SHA1')
    password = b64encode(token.digest()).decode()

    return username, password

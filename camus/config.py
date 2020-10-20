import os
import secrets
basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    STUN_HOST = os.environ.get('STUN_HOST') or 'stun.l.google.com'
    STUN_PORT = os.environ.get('STUN_PORT') or 19302
    TURN_HOST = os.environ.get('TURN_HOST')
    TURN_PORT = os.environ.get('TURN_PORT')
    TURN_STATIC_AUTH_SECRET = os.environ.get('TURN_STATIC_AUTH_SECRET')
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
    TWILIO_KEY_SID = os.environ.get('TWILIO_KEY_SID')

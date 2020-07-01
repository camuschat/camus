import os
basedir = os.path.abspath(os.path.dirname(__file__))

class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or '420sixtyn9ne'
    STUN_HOST = os.environ.get('STUN_HOST') or 'stun.l.google.com'
    STUN_PORT = os.environ.get('STUN_PORT') or 19302
    TURN_HOST = os.environ.get('TURN_HOST')
    TURN_PORT = os.environ.get('TURN_PORT')
    TURN_STATIC_AUTH_SECRET = os.environ.get('TURN_STATIC_AUTH_SECRET')

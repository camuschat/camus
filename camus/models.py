import uuid
from datetime import datetime

from slugify import slugify

from werkzeug.security import generate_password_hash, check_password_hash

from camus import db


class Room(db.Model):
    __tablename__ = 'rooms'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), index=True, unique=True)
    slug = db.Column(db.String(64), index=True, unique=True)
    password_hash = db.Column(db.String(128))
    guest_limit = db.Column(db.Integer, default=100)
    is_public = db.Column(db.Boolean, default=False)
    created = db.Column(db.DateTime, default=datetime.utcnow)
    active = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    clients = db.relationship('Client', backref='room')

    def __repr__(self):
        return '<Room {}>'.format(self.name)

    def set_name(self, name):
        self.name = name
        self.slug = slugify(name)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def authenticate(self, password=None):
        """Attempt to authenticate access to the room."""

        if ((password is None and self.password_hash is None)
                or (password and check_password_hash(self.password_hash, password))):
            return Client(uuid=uuid.uuid4().hex, room=self)

        return None


    def is_full(self):
        """Check whether the room's guest limit has been reached.

        Returns True if the guest limit has been reached, False otherwise.
        """
        return self.guest_limit and len(self.clients) >= self.guest_limit

    def active_ago(self):
        """The number of minutes ago that the room was last active."""
        now = datetime.utcnow().timestamp()
        return int((now - self.active.timestamp()) / 60)


class Client(db.Model):
    __tablename__ = 'clients'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), default='Major Tom')
    uuid = db.Column(db.String(32), unique=True, default=uuid.uuid4().hex)
    seen = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'))

    def __repr__(self):
        return '<Client {}>'.format(self.uuid)

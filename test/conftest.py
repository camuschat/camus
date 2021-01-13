import pytest

from camus import create_app, db
from camus.message_handler import MessageHandler
from camus.config import TestConfig


@pytest.fixture
async def app():
    """A new instance of the app."""
    _app = create_app(TestConfig)

    async with _app.app_context():
        db.create_all()

    yield _app

    async with _app.app_context():
        db.drop_all()


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture
async def message_handler(app):
    _message_handler = MessageHandler()
    async with app.app_context():
        _message_handler.start()
        yield _message_handler
        _message_handler.stop()

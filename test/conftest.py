import pytest

from camus import create_app, db
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

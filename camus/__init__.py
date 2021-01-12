from logging.config import dictConfig

dictConfig({
    'version': 1,
    'formatters': {'default': {
        #'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        'format': '[%(levelname)s] in %(module)s %(funcName)s %(lineno)d: %(message)s',
    }},
    'handlers': {'wsgi': {
        'class': 'logging.StreamHandler',
        'formatter': 'default'
    }},
    'root': {
        'level': 'INFO',
        'handlers': ['wsgi']
    }
})

import quart.flask_patch

from quart import Quart
from flask_bootstrap import Bootstrap
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

from .config import Config

bootstrap = Bootstrap()
db = SQLAlchemy()
migrate = Migrate()

def create_app(config_class=Config):
    app = Quart(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    bootstrap.init_app(app)
    db.init_app(app)

    # Apply blueprint for our routes
    from camus import routes
    app.register_blueprint(routes.bp)

    # Start background tasks before serving
    @app.before_serving
    async def startup():
        from camus.util import LoopTimer, ping_clients, reap_clients, reap_rooms
        from camus.message_handler import get_message_handler
        LoopTimer(20, ping_clients, message_handler=get_message_handler())
        LoopTimer(30, reap_clients, message_handler=get_message_handler())
        LoopTimer(300, reap_rooms)

    return app

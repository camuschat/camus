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
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import Config

app = Quart(__name__)
app.config.from_object(Config)
bootstrap = Bootstrap(app)
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour", "5 per minute"]
)

from app import routes

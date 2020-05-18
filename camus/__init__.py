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
from quart_rate_limiter import RateLimit, RateLimiter, timedelta

from .config import Config

app = Quart(__name__)
app.config.from_object(Config)
bootstrap = Bootstrap(app)
rate_limiter = RateLimiter(app,
    default_limits=[RateLimit(1000, timedelta(days=1)),
                    RateLimit(100, timedelta(hours=1)),
                    RateLimit(10, timedelta(minutes=1))]
)


from camus import routes

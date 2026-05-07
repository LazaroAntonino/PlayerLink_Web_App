"""
Shared Flask extensions — instantiated here, initialized in app.py with init_app().
This avoids circular imports between app.py and routes.py.
"""
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["60 per minute"],
    storage_uri="memory://",
)

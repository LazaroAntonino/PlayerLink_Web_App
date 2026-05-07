"""Shared test helpers (not pytest fixtures)."""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from flask_jwt_extended import create_access_token


def auth_header(app, user_id: int) -> dict:
    """Return an Authorization header dict for the given user_id."""
    with app.app_context():
        token = create_access_token(identity=str(user_id))
    return {"Authorization": f"Bearer {token}"}

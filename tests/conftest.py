"""
Pytest configuration and shared fixtures for PlayerLink tests.
"""
import sys
import os

# Make sure `src/` is on the path so Flask app can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

# Set env vars BEFORE importing the app so app.py picks them up
os.environ.setdefault("FLASK_DEBUG", "1")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("FLASK_APP_KEY", "test-flask-app-key")

import pytest
from flask_jwt_extended import create_access_token

from app import app as _app
from api.models import db as _db


def auth_header(app, user_id: int) -> dict:
    """Return an Authorization header dict for the given user_id."""
    with app.app_context():
        token = create_access_token(identity=str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def app():
    _app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
        # Disable rate limiting in tests
        RATELIMIT_ENABLED=False,
    )
    with _app.app_context():
        _db.create_all()
        yield _app
        _db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def db_session(app):
    """Wraps each test in a transaction that is rolled back after the test."""
    with app.app_context():
        connection = _db.engine.connect()
        transaction = connection.begin()
        _db.session.bind = connection
        yield _db.session
        _db.session.remove()
        transaction.rollback()
        connection.close()


def auth_header(app, user_id: int) -> dict:
    """Return an Authorization header dict for the given user_id."""
    with app.app_context():
        token = create_access_token(identity=str(user_id))
    return {"Authorization": f"Bearer {token}"}

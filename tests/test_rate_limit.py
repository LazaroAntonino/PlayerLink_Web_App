"""
Tests: rate limiting on auth endpoints.
NOTE: This test overrides RATELIMIT_ENABLED=True so it runs independently
      from the session-scoped `app` fixture (which disables rate limiting).
"""
import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from app import app as _app
from api.models import db


@pytest.fixture()
def rl_client():
    """Separate test client with rate limiting ON."""
    _app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite:///:memory:",
        RATELIMIT_ENABLED=True,
        RATELIMIT_STORAGE_URI="memory://",
    )
    with _app.app_context():
        db.create_all()
        yield _app.test_client()
        db.drop_all()


def test_login_rate_limit(rl_client):
    """More than 5 login attempts per minute → 6th returns 429."""
    payload = {"email": "x@x.com", "password": "wrong"}
    responses = [rl_client.post("/api/login", json=payload) for _ in range(6)]
    status_codes = [r.status_code for r in responses]
    # All first 5 should not be 429, and the 6th should be 429
    assert all(sc != 429 for sc in status_codes[:5])
    assert status_codes[5] == 429

"""
Tests: admin-only endpoints require is_admin=True.
"""
import pytest
from api.models import db, User
from helpers import auth_header
from api.utils import hash_password


def make_user(email: str, is_admin: bool = False) -> User:
    u = User(email=email, password=hash_password("Test1234!"), is_admin=is_admin)
    db.session.add(u)
    db.session.flush()
    return u


def test_get_users_without_admin_returns_403(client, app):
    """GET /api/users without admin token → 403."""
    with app.app_context():
        u = make_user("regular_user@test.com")
        db.session.commit()
        headers = auth_header(app, u.id)
        resp = client.get("/api/users", headers=headers)
        assert resp.status_code == 403


def test_get_users_with_admin_returns_200(client, app):
    """GET /api/users with admin token → 200."""
    with app.app_context():
        admin = make_user("admin_user@test.com", is_admin=True)
        db.session.commit()
        headers = auth_header(app, admin.id)
        resp = client.get("/api/users", headers=headers)
        assert resp.status_code == 200


def test_get_users_without_token_returns_401(client, app):
    """GET /api/users without any token → 401."""
    resp = client.get("/api/users")
    assert resp.status_code == 401

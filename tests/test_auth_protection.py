"""
Tests: JWT protection on endpoints.
"""
import pytest
from api.models import db, User, Profile
from helpers import auth_header
from api.utils import hash_password


def make_user(email: str, is_admin: bool = False) -> User:
    u = User(email=email, password=hash_password("Test1234!"), is_admin=is_admin)
    db.session.add(u)
    db.session.flush()
    p = Profile(user_id=u.id)
    db.session.add(p)
    db.session.flush()
    return u


def test_post_review_requires_token(client, app):
    """POST /api/reviews/<author>/<receiver> without token → 401."""
    with app.app_context():
        u1 = make_user("notoken_a@test.com")
        u2 = make_user("notoken_b@test.com")
        db.session.commit()
        resp = client.post(f"/api/reviews/{u1.id}/{u2.id}", json={"stars": 4, "comment": "nice"})
        assert resp.status_code == 401


def test_post_review_wrong_user_returns_403(client, app):
    """POST /api/reviews/<author>/<receiver> with wrong JWT → 403."""
    with app.app_context():
        u1 = make_user("author_wrong@test.com")
        u2 = make_user("receiver_wrong@test.com")
        u3 = make_user("intruder_wrong@test.com")
        db.session.commit()
        headers = auth_header(app, u3.id)  # u3 tries to post as u1
        resp = client.post(
            f"/api/reviews/{u1.id}/{u2.id}",
            json={"stars": 4, "comment": "nice"},
            headers=headers,
        )
        assert resp.status_code == 403


def test_post_review_correct_user_succeeds(client, app):
    """POST /api/reviews/<author>/<receiver> with correct JWT → 2xx."""
    with app.app_context():
        u1 = make_user("author_ok@test.com")
        u2 = make_user("receiver_ok@test.com")
        db.session.commit()
        headers = auth_header(app, u1.id)
        resp = client.post(
            f"/api/reviews/{u1.id}/{u2.id}",
            json={"stars": 5, "comment": "great"},
            headers=headers,
        )
        assert resp.status_code in (200, 201)

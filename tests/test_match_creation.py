"""
Tests: match creation via mutual likes.
"""
import pytest
from api.models import db, User, Profile, Like, Match
from helpers import auth_header
from api.utils import hash_password


def make_user(email: str) -> User:
    u = User(email=email, password=hash_password("Test1234!"))
    db.session.add(u)
    db.session.flush()
    p = Profile(user_id=u.id)
    db.session.add(p)
    db.session.flush()
    return u


def test_one_sided_like_is_not_match(client, app):
    """A→B like alone should NOT create a Match."""
    with app.app_context():
        a = make_user("match_a1@test.com")
        b = make_user("match_b1@test.com")
        db.session.commit()

        headers = auth_header(app, a.id)
        resp = client.post(
            f"/api/likes/{a.id}/{b.id}",
            headers=headers,
        )
        assert resp.status_code in (200, 201)
        data = resp.get_json()
        assert data.get("is_match") is False or data.get("is_match") == False

        matches = db.session.query(Match).filter(
            ((Match.user1_id == a.id) & (Match.user2_id == b.id)) |
            ((Match.user1_id == b.id) & (Match.user2_id == a.id))
        ).count()
        assert matches == 0


def test_mutual_like_creates_match(client, app):
    """A→B then B→A should create a Match and return is_match:true."""
    with app.app_context():
        a = make_user("match_a2@test.com")
        b = make_user("match_b2@test.com")
        db.session.commit()

        # A likes B
        client.post(f"/api/likes/{a.id}/{b.id}", headers=auth_header(app, a.id))

        # B likes A
        resp = client.post(f"/api/likes/{b.id}/{a.id}", headers=auth_header(app, b.id))
        assert resp.status_code in (200, 201)
        data = resp.get_json()
        assert data.get("is_match") is True

        matches = db.session.query(Match).filter(
            ((Match.user1_id == a.id) & (Match.user2_id == b.id)) |
            ((Match.user1_id == b.id) & (Match.user2_id == a.id))
        ).count()
        assert matches == 1

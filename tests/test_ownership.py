"""
Tests: ownership checks — user can't modify another user's resources.
"""
import pytest
from api.models import db, User, Profile, Game
from helpers import auth_header
from api.utils import hash_password


def make_user_with_game(email: str, game_title: str = "Valorant") -> tuple:
    u = User(email=email, password=hash_password("Test1234!"))
    db.session.add(u)
    db.session.flush()
    p = Profile(user_id=u.id)
    db.session.add(p)
    db.session.flush()
    g = Game(profile_id=p.id, game_title=game_title, game_hoursPlayed=10)
    db.session.add(g)
    db.session.flush()
    return u, g


def test_delete_other_users_game_returns_403(client, app):
    """DELETE /api/games/<id> for a game owned by another user → 403."""
    with app.app_context():
        owner, game = make_user_with_game("owner_game@test.com")
        intruder = User(email="intruder_game@test.com", password=hash_password("Test1234!"))
        db.session.add(intruder)
        db.session.commit()

        headers = auth_header(app, intruder.id)
        resp = client.delete(f"/api/games/{game.id}", headers=headers)
        assert resp.status_code == 403


def test_delete_own_game_succeeds(client, app):
    """DELETE /api/games/<id> for user's own game → 2xx."""
    with app.app_context():
        owner, game = make_user_with_game("owner_del@test.com")
        db.session.commit()

        headers = auth_header(app, owner.id)
        resp = client.delete(f"/api/games/{game.id}", headers=headers)
        assert resp.status_code in (200, 204)

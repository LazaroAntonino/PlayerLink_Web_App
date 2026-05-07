"""
Tests: password reset token flow.
"""
import pytest
import hashlib
from datetime import datetime, timezone, timedelta
from api.models import db, User, PasswordResetToken
from api.utils import hash_password


def make_user(email: str) -> User:
    u = User(email=email, password=hash_password("OldPass1!"))
    db.session.add(u)
    db.session.flush()
    return u


def test_check_mail_nonexistent_email_returns_200(client, app):
    """Anti-enumeration: POST /api/check_mail with unknown email → 200."""
    resp = client.post("/api/check_mail", json={"email": "nobody@unknown.com"})
    assert resp.status_code == 200


def test_valid_token_updates_password(client, app):
    """A valid unused token should allow a password update."""
    import secrets
    with app.app_context():
        u = make_user("reset_valid@test.com")
        db.session.commit()

        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires = datetime.now(timezone.utc) + timedelta(minutes=15)
        prt = PasswordResetToken(user_id=u.id, token_hash=token_hash, expires_at=expires)
        db.session.add(prt)
        db.session.commit()

    resp = client.post(
        "/api/password_update_with_token",
        json={"token": raw_token, "password": "NewPass1!"},
    )
    assert resp.status_code == 200


def test_reused_token_returns_400(client, app):
    """A token that was already used should return 400."""
    import secrets
    with app.app_context():
        u = make_user("reset_reused@test.com")
        db.session.commit()

        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires = datetime.now(timezone.utc) + timedelta(minutes=15)
        used_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        prt = PasswordResetToken(user_id=u.id, token_hash=token_hash, expires_at=expires, used_at=used_at)
        db.session.add(prt)
        db.session.commit()

    resp = client.post(
        "/api/password_update_with_token",
        json={"token": raw_token, "password": "NewPass1!"},
    )
    assert resp.status_code == 400


def test_expired_token_returns_400(client, app):
    """An expired token should return 400."""
    import secrets
    with app.app_context():
        u = make_user("reset_expired@test.com")
        db.session.commit()

        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires = datetime.now(timezone.utc) - timedelta(minutes=1)  # already expired
        prt = PasswordResetToken(user_id=u.id, token_hash=token_hash, expires_at=expires)
        db.session.add(prt)
        db.session.commit()

    resp = client.post(
        "/api/password_update_with_token",
        json={"token": raw_token, "password": "NewPass1!"},
    )
    assert resp.status_code == 400

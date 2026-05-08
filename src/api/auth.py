"""
Authentication & User management blueprint.
Routes: /register, /login, /mailer, /token, /check_mail,
        /password_update, /password_update_with_token,
        /private, /users (CRUD)
"""
import os
import secrets
import hashlib
from datetime import timedelta, datetime

from flask import Blueprint, request, jsonify
from sqlalchemy import select
from flask_jwt_extended import (
    create_access_token, get_jwt_identity, jwt_required
)
from werkzeug.security import check_password_hash
from dotenv import load_dotenv

from api.models import db, User, Profile, PasswordResetToken, EmailVerificationToken
from api.utils import admin_required, hash_password
from api.extensions import limiter
from flask_limiter.util import get_remote_address
from api.mail.mailer import send_email, send_verification_email

load_dotenv()

auth_bp = Blueprint('auth', __name__)


# ── REGISTER ──────────────────────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
@limiter.limit("3 per minute")
def register():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400

        if db.session.execute(select(User).where(User.email == email)).scalar_one_or_none():
            return jsonify({'error': 'Email already in use'}), 409

        hashed_password = hash_password(password)
        new_user = User(email=email, password=hashed_password, email_verified=False)

        new_user.profile = Profile(
            gender='',
            age=0,
            discord='',
            name='',
            preferences='',
            zodiac='',
            location='',
            nick_name='',
            bio='',
            language='',
            steam_id='',
            photo='photo1'
        )

        # Build verification token BEFORE commit (so user.id is available via flush)
        raw_token   = secrets.token_urlsafe(32)
        token_hash  = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at  = datetime.utcnow() + timedelta(hours=24)

        db.session.add(new_user)
        db.session.flush()   # assigns new_user.id without committing

        ver_token = EmailVerificationToken(
            user_id=new_user.id,
            token_hash=token_hash,
            expires_at=expires_at
        )
        db.session.add(ver_token)
        db.session.commit()

        # Send verification email (best-effort: log on failure but don't abort)
        email_result = send_verification_email(email, raw_token)
        if not email_result.get('success'):
            print(f"[WARN] Verification email failed for {email}: {email_result.get('msg')}")
            if os.getenv("FLASK_DEBUG") == "1":
                frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
                print(f"[DEV] Verify URL: {frontend_url}/verify-email?token={raw_token}")

        return jsonify({'success': True, 'email_sent': True}), 201

    except Exception as e:
        db.session.rollback()
        print(f"[REGISTER ERROR] {type(e).__name__}: {e}")
        return jsonify({'error': 'Internal error during registration'}), 500


# ── LOGIN ─────────────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            raise Exception('missing data')
        stmt = select(User).where(User.email == data['email'])
        user = db.session.execute(stmt).scalar_one_or_none()

        if not user:
            return jsonify({'error': 'Email not registered'}), 401

        if not check_password_hash(user.password, data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401

        # Block login until email is verified
        if not user.email_verified:
            return jsonify({
                'error': 'Email not verified',
                'email': user.email,
            }), 403

        token = create_access_token(identity=str(user.id))
        return jsonify({'success': True, 'token': token}), 200
    except Exception as e:
        print(f"[LOGIN ERROR] {type(e).__name__}: {e}")
        return jsonify({'error': 'Login failed', 'detail': str(e)}), 400


# ── MAILER ────────────────────────────────────────────────────────────────────
@auth_bp.route('/mailer/<address>', methods=['POST'])
def handle_mail(address):
    return send_email(address)


# ── VERIFY EMAIL ──────────────────────────────────────────────────────────────
@auth_bp.route('/verify-email', methods=['POST'])
def verify_email():
    """
    Consumes a one-time verification token and marks the user's email as
    verified. Returns a JWT so the frontend can log the user in immediately.
    """
    try:
        data = request.get_json(silent=True) or {}
        raw_token = data.get('token', '').strip()

        if not raw_token:
            return jsonify({'error': 'Token requerido'}), 400

        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        ver_token  = db.session.query(EmailVerificationToken).filter_by(
            token_hash=token_hash
        ).first()

        now = datetime.utcnow()
        if not ver_token:
            return jsonify({'error': 'Enlace de verificación inválido'}), 400
        if ver_token.used_at is not None:
            return jsonify({'error': 'Este enlace ya fue utilizado. Si necesitas otro, solicita el reenvío.'}), 400
        if ver_token.expires_at.replace(tzinfo=None) < now:
            return jsonify({'error': 'El enlace ha expirado. Por favor, solicita un nuevo correo de verificación.'}), 400

        user = db.session.get(User, ver_token.user_id)
        if not user:
            return jsonify({'error': 'Usuario no encontrado'}), 404

        # Mark token as used and user as verified
        ver_token.used_at   = now
        user.email_verified = True
        db.session.commit()

        # Issue JWT — user is now fully authenticated
        jwt_token = create_access_token(identity=str(user.id))
        return jsonify({'success': True, 'token': jwt_token}), 200

    except Exception as e:
        db.session.rollback()
        print(f"[VERIFY EMAIL ERROR] {type(e).__name__}: {e}")
        return jsonify({'error': 'Error interno del servidor'}), 500


# ── RESEND VERIFICATION EMAIL ─────────────────────────────────────────────────
@auth_bp.route('/resend-verification', methods=['POST'])
@limiter.limit(
    "3 per 15 minutes",
    key_func=lambda: (request.get_json(silent=True) or {}).get('email') or get_remote_address()
)
def resend_verification():
    """
    Re-sends the email verification link. Always returns 200 (anti-enumeration).
    Rate-limited to 3 requests per 15 minutes per email address.
    """
    try:
        data  = request.get_json(silent=True) or {}
        email = data.get('email', '').strip().lower()

        if not email:
            return jsonify({'success': True}), 200  # anti-enumeration

        user = db.session.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()

        if user and not user.email_verified:
            # Invalidate all previous unused tokens for this user
            db.session.query(EmailVerificationToken).filter_by(
                user_id=user.id
            ).filter(
                EmailVerificationToken.used_at.is_(None)
            ).update({'used_at': datetime.utcnow()})

            # Create a fresh token (24 h expiry)
            raw_token  = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
            new_token  = EmailVerificationToken(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=datetime.utcnow() + timedelta(hours=24)
            )
            db.session.add(new_token)
            db.session.commit()

            email_result = send_verification_email(email, raw_token)
            if not email_result.get('success'):
                print(f"[WARN] Resend verification email failed for {email}: {email_result.get('msg')}")
                if os.getenv("FLASK_DEBUG") == "1":
                    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
                    print(f"[DEV] Verify URL: {frontend_url}/verify-email?token={raw_token}")

        return jsonify({'success': True}), 200

    except Exception as e:
        db.session.rollback()
        print(f"[RESEND VERIFICATION ERROR] {type(e).__name__}: {e}")
        return jsonify({'success': True}), 200  # always 200 (anti-enumeration)


# ── TOKEN CHECK ───────────────────────────────────────────────────────────────
@auth_bp.route('/token', methods=['GET'])
@jwt_required()
def check_jwt():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if user:
        return jsonify({'success': True, 'user': user.serialize()}), 200
    return jsonify({'success': False, 'msg': 'Bad token'}), 401


# ── CHECK MAIL (password recovery) ───────────────────────────────────────────
@auth_bp.route("/check_mail", methods=['POST'])
@limiter.limit(
    "3 per 15 minutes",
    key_func=lambda: (request.get_json(silent=True) or {}).get('email') or get_remote_address()
)
def check_mail():
    try:
        data = request.json
        email = data.get('email', '')
        user = db.session.execute(
            select(User).where(User.email == email)
        ).scalar_one_or_none()

        # Anti-enumeration: always respond 200 regardless of whether user exists
        if user:
            # Invalidate previous unused tokens for this user
            prev_tokens = db.session.query(PasswordResetToken).filter_by(
                user_id=user.id
            ).filter(PasswordResetToken.used_at.is_(None)).all()
            for t in prev_tokens:
                t.used_at = datetime.utcnow()

            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
            expires_at = datetime.utcnow() + timedelta(minutes=15)

            reset_token = PasswordResetToken(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=expires_at
            )
            db.session.add(reset_token)
            db.session.commit()

            send_email(email, raw_token)

        return jsonify({'success': True}), 200
    except Exception:
        return jsonify({'success': True}), 200


# ── PASSWORD UPDATE (JWT required) ───────────────────────────────────────────
@auth_bp.route('/password_update', methods=['PUT'])
@jwt_required()
def password_update():
    try:
        data = request.get_json(force=True)
        if not data or 'password' not in data or not data['password']:
            return jsonify({'success': False, 'msg': 'Falta el campo password'}), 422
        id = int(get_jwt_identity())
        user = db.session.get(User, id)
        if not user:
            return jsonify({'success': False, 'msg': 'Falta el user'}), 422
        user.password = hash_password(data['password'])
        db.session.commit()
        return jsonify({'success': True, 'msg': 'Contraseña actualizada exitosamente, intente iniciar sesion'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'msg': f"Error: {str(e)}"})


# ── PASSWORD UPDATE WITH TOKEN (no JWT) ──────────────────────────────────────
@auth_bp.route('/password_update_with_token', methods=['POST'])
def password_update_with_token():
    try:
        data = request.get_json(force=True)
        raw_token = (data or {}).get('token', '')
        new_password = (data or {}).get('password', '')

        if not raw_token or not new_password:
            return jsonify({'success': False, 'msg': 'Invalid or expired token'}), 400

        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        reset_token = db.session.query(PasswordResetToken).filter_by(
            token_hash=token_hash
        ).first()

        now = datetime.utcnow()
        if (
            not reset_token
            or reset_token.used_at is not None
            or reset_token.expires_at < now
        ):
            return jsonify({'success': False, 'msg': 'Invalid or expired token'}), 400

        reset_token.used_at = now
        user = db.session.get(User, reset_token.user_id)
        user.password = hash_password(new_password)
        db.session.commit()

        return jsonify({'success': True, 'msg': 'Password updated successfully'}), 200
    except Exception:
        db.session.rollback()
        return jsonify({'success': False, 'msg': 'Invalid or expired token'}), 400


# ── PRIVATE (get current user from JWT) ──────────────────────────────────────
@auth_bp.route('/private', methods=['GET'])
@jwt_required()
def get_user_info():
    id = int(get_jwt_identity())
    user = db.session.execute(select(User).where(User.id == id)).scalar_one_or_none()
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'success': True, 'user': user.serialize()}), 200


# ── USERS CRUD ────────────────────────────────────────────────────────────────
@auth_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    users = db.session.execute(select(User)).scalars().all()
    return jsonify([user.serialize() for user in users]), 200


@auth_bp.route('/users/<int:user_id>', methods=['GET'])
def get_single_user(user_id):
    user = db.session.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'User with id {user_id} not found'}), 404
    return jsonify(user.serialize()), 200


@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    user = db.session.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'User with id {user_id} not found'}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': f'User {user_id} deleted'}), 200


@auth_bp.route('/users', methods=['POST'])
def post_user():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Missing data'}), 400
    new_user = User(
        email=data['email'],
        password=hash_password(data['password'])
    )
    db.session.add(new_user)
    db.session.commit()
    return jsonify(new_user.serialize()), 200


@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def put_user(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Missing data'}), 400
    user = db.session.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'User with id {user_id} not found'}), 404
    user.email = data.get('email', user.email)
    if 'password' in data and data['password']:
        user.password = hash_password(data['password'])
    db.session.commit()
    return jsonify(user.serialize()), 200


@auth_bp.route('/users_email/<int:user_id>', methods=['PUT'])
@jwt_required()
def put_user_email(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Missing data'}), 400

    existing = db.session.execute(
        select(User).where(User.email == data['email'])
    ).scalar_one_or_none()
    if existing is not None:
        return jsonify({'error': 'That email is already in use'}), 409

    user = db.session.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'User with id {user_id} not found'}), 404
    user.email = data.get('email', user.email)
    db.session.commit()
    return jsonify(user.serialize()), 200


@auth_bp.route('/users_password/<int:user_id>', methods=['PUT'])
@jwt_required()
def users_password(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    required_fields = ['password', 'actualPassword']

    if not data or not all(field in data and data[field] for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos'}), 400

    user = db.session.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'Usuario con id {user_id} no encontrado'}), 404

    if not check_password_hash(user.password, data['actualPassword']):
        return jsonify({'error': 'Contraseña actual incorrecta'}), 401

    user.password = hash_password(data['password'])
    db.session.commit()
    return jsonify({'msg': 'Contraseña actualizada correctamente'}), 200

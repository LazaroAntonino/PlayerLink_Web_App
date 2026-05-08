"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
import json
import anthropic as _anthropic_module
from flask import Flask, request, jsonify, url_for, Blueprint, current_app
from api.models import db, User, Profile, Review, Match, Reject, Game, Like, ChatMessage, PasswordResetToken
from api.utils import generate_sitemap, APIException, admin_required, hash_password
from sqlalchemy import select, or_, not_
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash

from dotenv import load_dotenv
import secrets
import hashlib
from datetime import timedelta
from datetime import datetime
from flask_mail import Message
from api.mail.mailer import send_email

# Carga variables de entorno desde .env
load_dotenv()

from api.extensions import limiter
from flask_limiter.util import get_remote_address

api = Blueprint('api', __name__)

# Allow CORS requests to this API — configured in app.py

# ── Anthropic client (instanciado una vez) ────────────────────────────────
_anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
anthropic_client = _anthropic_module.Anthropic(api_key=_anthropic_api_key) if _anthropic_api_key else None


@api.route('/register', methods=['POST'])
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
        new_user = User(email=email, password=hashed_password)

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
            photo='photo1'  # Imagen por defecto
        )

        db.session.add(new_user)
        db.session.commit()

        token = create_access_token(identity=str(new_user.id))
        return jsonify({'success': True, 'token': token}), 201

    except Exception as e:
        return jsonify({'error': 'Internal error during registration'}), 500


# LOGIN
@api.route('/login', methods=['POST'])
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

        token = create_access_token(identity=str(user.id))
        return jsonify({'success': True, 'token': token}), 200
    except Exception as e:
        print(f"[LOGIN ERROR] {type(e).__name__}: {e}")
        return jsonify({'error': 'Login failed', 'detail': str(e)}), 400


@api.route('/mailer/<address>', methods=['POST'])
def handle_mail(address):
    return send_email(address)


@api.route('/token', methods=['GET'])
@jwt_required()
def check_jwt():
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if user:
        return jsonify({'success': True, 'user': user.serialize()}), 200
    return jsonify({'success': False, 'msg': 'Bad token'}), 401

# funcion para verificar que el correo esta en la base de datos y enviar el correo de recuperacion de estarlo


@api.route("/check_mail", methods=['POST'])
@limiter.limit("3 per 15 minutes", key_func=lambda: (request.get_json(silent=True) or {}).get('email') or get_remote_address())
def check_mail():
    try:
        data = request.json
        email = data.get('email', '')
        user = db.session.execute(select(User).where(User.email == email)).scalar_one_or_none()

        # Anti-enumeration: always respond 200 regardless of whether user exists
        if user:
            # Invalidate previous unused tokens for this user
            prev_tokens = db.session.query(PasswordResetToken).filter_by(
                user_id=user.id
            ).filter(PasswordResetToken.used_at.is_(None)).all()
            for t in prev_tokens:
                t.used_at = datetime.utcnow()

            # Generate a new single-use token
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

            # Send email with the raw token (not the hash)
            send_email(email, raw_token)

        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'success': True}), 200


# ruta para actualizar el password. Se consume desde la vista para hacer el reset en el front
@api.route('/password_update', methods=['PUT'])
@jwt_required()
def password_update():
    try:
        data = request.get_json(force=True)
        if not data or 'password' not in data or not data['password']:
            return jsonify({'success': False, 'msg': 'Falta el campo password'}), 422
        # extraemos el id del token que creamos en la linea 133
        id = int(get_jwt_identity())
        if not id:
            return jsonify({'success': False, 'msg': 'Falta el id'}), 422
        # buscamos usuario por id
        user = db.session.get(User, id)
        if not user:
            return jsonify({'success': False, 'msg': 'Falta el user'}), 422

        # actualizamos password del usuario
        hashed_password = hash_password(data['password'])
        user.password = hashed_password
        # alacenamos los cambios
        db.session.commit()
        return jsonify({'success': True, 'msg': 'Contraseña actualizada exitosamente, intente iniciar sesion'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'msg': f"Error al enviar el correo: {str(e)}"})


# POST — single-use reset token flow (no JWT required)
@api.route('/password_update_with_token', methods=['POST'])
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

        # Mark as used
        reset_token.used_at = now

        # Update password
        user = db.session.get(User, reset_token.user_id)
        user.password = hash_password(new_password)
        db.session.commit()

        return jsonify({'success': True, 'msg': 'Password updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'msg': 'Invalid or expired token'}), 400
@api.route('/private', methods=['GET'])
@jwt_required()
def get_user_info():
    id = int(get_jwt_identity())
    stmt = select(User).where(User.id == id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'success': True, 'user': user.serialize()}), 200

# GET ALL USERS


@api.route('/users', methods=['GET'])
@admin_required
def get_users():
    stmt = select(User)
    users = db.session.execute(stmt).scalars().all()
    return jsonify([user.serialize() for user in users]), 200

# GET SINGLE USER


@api.route('/users/<int:user_id>', methods=['GET'])
def get_single_user(user_id):
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'User with id {user_id} not found'}), 404
    return jsonify(user.serialize()), 200

# DELETE USER
@api.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'User with id {user_id} not found'}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': f'User {user_id} deleted'}), 200

# POST USER
@api.route('/users', methods=['POST'])
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

# PUT USER
@api.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def put_user(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Missing data'}), 400
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'User with id {user_id} not found'}), 404
    user.email = data.get('email', user.email)
    if 'password' in data and data['password']:
        user.password = hash_password(data['password'])
    db.session.commit()
    return jsonify(user.serialize()), 200

# PUT USER EMAIL
@api.route('/users_email/<int:user_id>', methods=['PUT'])
@jwt_required()
def put_user_email(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Missing data'}), 400

    emailstmt = select(User).where(User.email == data['email'])
    existingEmail = db.session.execute(emailstmt).scalar_one_or_none()

    if existingEmail is not None:
        return jsonify({'error': 'That email is already in use'}), 409

    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'User with id {user_id} not found'}), 404
    user.email = data.get('email', user.email)
    db.session.commit()
    return jsonify(user.serialize()), 200


# PUT USER PASSWORD
@api.route('/users_password/<int:user_id>', methods=['PUT'])
@jwt_required()
def users_password(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    required_fields = ['password', 'actualPassword']

    if not data or not all(field in data and data[field] for field in required_fields):
        return jsonify({'error': 'Faltan campos requeridos'}), 400

    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()

    if user is None:
        return jsonify({'error': f'Usuario con id {user_id} no encontrado'}), 404

    if not check_password_hash(user.password, data['actualPassword']):
        return jsonify({'error': 'Contraseña actual incorrecta'}), 401

    user.password = hash_password(data['password'])
    db.session.commit()

    return jsonify({'msg': 'Contraseña actualizada correctamente'}), 200


# GET ALL PROFILES
@api.route('/profiles', methods=['GET'])
@admin_required
def get_profiles():
    stmt = select(Profile)
    profiles = db.session.execute(stmt).scalars().all()
    return jsonify([profile.serialize() for profile in profiles]), 200


# GET SINGLE PROFILE BY USER ID
@api.route('/profiles/user/<int:user_id>', methods=['GET'])
def get_single_profile_by_user(user_id):
    stmt = select(Profile).where(Profile.user_id == user_id)
    profile = db.session.execute(stmt).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'Profile for user with id {user_id} not found'}), 404
    return jsonify(profile.serialize()), 200

# GET SINGLE PROFILE BY PROFILE ID


@api.route('/profiles/<int:profile_id>', methods=['GET'])
def get_single_profile(profile_id):
    stmt = select(Profile).where(Profile.id == profile_id)
    profile = db.session.execute(stmt).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'Profile with id {profile_id} not found'}), 404
    return jsonify(profile.serialize()), 200

# DELETE PROFILE BY USER ID
@api.route('/profiles/user/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_profile_by_user_id(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    stmt = select(Profile).where(Profile.user_id == user_id)
    profile = db.session.execute(stmt).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'Profile for user with id {user_id} not found'}), 404
    db.session.delete(profile)
    db.session.commit()
    return jsonify({'message': f'Profile of user {user_id} deleted'}), 200

# DELETE PROFILE BY PROFILE ID
@api.route('/profiles/<int:profile_id>', methods=['DELETE'])
@jwt_required()
def delete_profile(profile_id):
    stmt = select(Profile).where(Profile.id == profile_id)
    profile = db.session.execute(stmt).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'Profile with id {profile_id} not found'}), 404
    # Only the owner may delete their own profile
    requesting_id = int(get_jwt_identity())
    if requesting_id != profile.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(profile)
    db.session.commit()
    return jsonify({'message': f'Profile {profile_id} deleted'}), 200

# POST PROFILE


@api.route('/profiles/<int:user_id>', methods=['POST'])
@jwt_required()
def post_profile(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'can not find user with id: {user_id}'}), 404
    if user.profile:
        return jsonify({'error': 'this profile already exist, please try to modify it insted of create a new one'}), 409
    new_profile = Profile(
        gender=data.get('gender') or None,
        age=data.get('age') or 0,
        discord=data.get('discord') or None,
        name=data.get('name') or None,
        preferences=data.get('preferences') or None,
        zodiac=data.get('zodiac') or None,
        location=data.get('location') or None,
        nick_name=data.get('nick_name') or None,
        bio=data.get('bio') or None,
        language=data.get('language') or None,
        steam_id=data.get('steam_id') or None,
        photo=data.get('photo') or 'photo1'
    )
    user.profile = new_profile
    db.session.commit()
    return jsonify(user.profile.serialize()), 200


# PUT PROFILE
@api.route('/profiles/<int:user_id>', methods=['PUT'])
@jwt_required()
def put_profile(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'can not find user with id: {user_id}'}), 404
    if not user.profile:
        return jsonify({'error': 'this profile do not  exist, please try to create it insted of modify one'}), 404

    def _val(key, current):
        """Returns None if key was explicitly sent as empty string, else uses sent value or keeps current."""
        if key not in data:
            return current
        v = data[key]
        if v == "" or v is None:
            return None
        return v

    user.profile.gender     = _val('gender',      user.profile.gender)
    user.profile.preferences = _val('preferences', user.profile.preferences)
    user.profile.zodiac     = _val('zodiac',       user.profile.zodiac)
    user.profile.discord    = _val('discord',      user.profile.discord)
    user.profile.age        = data.get('age',      user.profile.age)
    user.profile.name       = _val('name',         user.profile.name)
    user.profile.location   = _val('location',     user.profile.location)
    user.profile.nick_name  = _val('nick_name',    user.profile.nick_name)
    user.profile.bio        = _val('bio',          user.profile.bio)
    user.profile.language   = _val('language',     user.profile.language)
    user.profile.steam_id   = _val('steam_id',     user.profile.steam_id)
    user.profile.photo      = data.get('photo',    user.profile.photo) or 'photo1'

    db.session.commit()
    return jsonify(user.profile.serialize()), 200

# GET profiles exluyendo a los que ya se dio like o dislike /////////////////////////////////////////////


@api.route('/profiles/profiles_to_explore/<int:user_id>', methods=['GET'])
@jwt_required()
def profiles_to_explore(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'User with id {user_id} not found'}), 404

    liked_user_ids    = [like.liked_id for like in user.likes_given]
    rejected_user_ids = [reject.rejected_id for reject in user.rejects_given]
    exclude_ids = set(liked_user_ids + rejected_user_ids + [user_id])

    # ── Query base — idéntica al comportamiento anterior ──────────────────
    query = (
        db.session.query(Profile)
        .join(User)
        .filter(~User.id.in_(exclude_ids))
    )

    # ── Filtros opcionales — solo se aplican si se pasan como query params ─
    filters_applied = {}

    # game: filtra por título de juego (join con tabla games)
    game = request.args.get('game', '').strip()
    if game:
        from api.models import Game as GameModel
        query = (
            query
            .join(GameModel, GameModel.profile_id == Profile.id)
            .filter(GameModel.game_title.ilike(f'%{game}%'))
        )
        filters_applied['game'] = game

    # preference: filtra en el campo preferences (plataformas + estilo almacenados como CSV)
    preference = request.args.get('preference', '').strip()
    if preference:
        query = query.filter(Profile.preferences.ilike(f'%{preference}%'))
        filters_applied['preference'] = preference

    # language: filtra en el campo language (CSV de idiomas)
    language = request.args.get('language', '').strip()
    if language:
        query = query.filter(Profile.language.ilike(f'%{language}%'))
        filters_applied['language'] = language

    # location: coincidencia parcial en location
    location = request.args.get('location', '').strip()
    if location:
        query = query.filter(Profile.location.ilike(f'%{location}%'))
        filters_applied['location'] = location

    # gender: coincidencia exacta (case-insensitive)
    gender = request.args.get('gender', '').strip()
    if gender:
        query = query.filter(Profile.gender.ilike(gender))
        filters_applied['gender'] = gender

    # age_min / age_max: rango de edad
    age_min = request.args.get('age_min', type=int)
    age_max = request.args.get('age_max', type=int)
    if age_min is not None:
        query = query.filter(Profile.age >= age_min)
        filters_applied['age_min'] = age_min
    if age_max is not None:
        query = query.filter(Profile.age <= age_max)
        filters_applied['age_max'] = age_max

    profiles = query.all()

    return jsonify({
        'profiles':        [p.serialize() for p in profiles],
        'total':           len(profiles),
        'filters_applied': filters_applied,
    }), 200

# PUT PHOTO PROFILE


@api.route('/profiles/photo/<int:user_id>', methods=['PUT'])
@jwt_required()
def put_profilephoto(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data or 'photo' not in data:
        return jsonify({'error': 'Missing data'}), 400
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'can not find user with id: {user_id}'}), 404
    if not user.profile:
        return jsonify({'error': 'this profile do not  exist, please try to create it insted of modify one'}), 404

    user.profile.photo = data.get('photo', user.profile.photo)

    db.session.commit()
    return jsonify(user.profile.serialize()), 200


# GET ALL REVIEWS
@api.route('/reviews', methods=['GET'])
@admin_required
def get_All_Reviews():
    stmt = select(Review)
    reviews = db.session.execute(stmt).scalars().all()
    return jsonify([review.serialize() for review in reviews]), 200


# GET SINGLE REVIEW
@api.route('/reviews/<int:review_id>', methods=['GET'])
def get_reviews(review_id):
    stmt = select(Review).where(Review.id == review_id)
    review = db.session.execute(stmt).scalar_one_or_none()
    if review is None:
        return jsonify({'error': f'review with id: {review_id} does not exist'}), 404
    return jsonify(review.serialize()), 200


# GET REVIEWS AUTHORED
@api.route('/reviews_authored/<int:user_id>', methods=['GET'])
def get_reviews_authored(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 404

    serialized = [rev.serialize() | {"stars": rev.stars, "comment": rev.comment}
                  for rev in user.reviews_authored]
    return jsonify({"reviews_authored": serialized}), 200


# GET USER REVIEWS
@api.route('/reviews_received/<int:user_id>', methods=['GET'])
def get_user_reviews(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 404

    serialized = [rev.serialize() | {"stars": rev.stars, "comment": rev.comment}
                  for rev in user.reviews_received]
    return jsonify({"reviews_received": serialized}), 200


# DELETE REVIEW
@api.route('/reviews/<int:review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    review = db.session.get(Review, review_id)
    if review is None:
        return jsonify({'error': 'that review does not exist'}), 404
    requesting_id = int(get_jwt_identity())
    if review.author_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403

    db.session.delete(review)
    db.session.commit()
    return jsonify({'message': 'review deleted'}), 200


# POST REVIEW
@api.route('/reviews/<int:author_id>/<int:receiver_id>', methods=['POST'])
@jwt_required()
def post_review(author_id, receiver_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != author_id:
        return jsonify({'error': 'Unauthorized'}), 403
    if author_id == receiver_id:
        return jsonify({'error': 'No puedes comentar sobre ti mismo'}), 400

    user_author = db.session.get(User, author_id)
    user_receiver = db.session.get(User, receiver_id)
    if user_author is None or user_receiver is None:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    data = request.get_json() or {}
    if 'stars' not in data or 'comment' not in data:
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    stars = int(data['stars'])
    if not 1 <= stars <= 5:
        return jsonify({'error': '“stars” debe estar entre 1 y 5'}), 400

    comment = data['comment'].strip()
    if not comment:
        return jsonify({'error': 'El comentario no puede estar vacío'}), 400

    # 5) Crear y persistir la reseña
    new_review = Review(
        user_id=receiver_id,
        author_id=author_id,
        stars=stars,
        comment=comment
    )

    db.session.add(new_review)
    db.session.commit()

    return jsonify(new_review.serialize()), 201


# PUT REVIEW
@api.route('/reviews/<int:review_id>', methods=['PUT'])
@jwt_required()
def put_review(review_id):
    review = db.session.get(Review, review_id)
    if review is None:
        return jsonify({'error': 'that review does not exist'}), 404
    requesting_id = int(get_jwt_identity())
    if review.author_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()

    if 'stars' not in data or 'comment' not in data:
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    review.stars = data.get('stars', review.stars)
    review.comment = data.get('comment', review.comment)
    db.session.commit()
    return jsonify({'message': 'review updated'}), 200


# GET ALL MATCHES
@api.route('/matches', methods=['GET'])
@admin_required
def get_all_matches():
    stmt = select(Match)
    matches = db.session.execute(stmt).scalars().all()
    return jsonify([match.serialize() for match in matches]), 200


# GET MATCH BY MATCH ID
@api.route('/matches/<int:match_id>', methods=['GET'])
def get_single_match(match_id):
    stmt = select(Match).where(Match.id == match_id)
    match = db.session.execute(stmt).scalar_one_or_none()
    if not match:
        return jsonify({'error': f'Match with id {match_id} not found'}), 404
    return jsonify(match.serialize()), 200


@api.route('/matches/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_matches_for_user(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    # 1) Sacar todos los Match donde aparezca este usuario como user1 o como user2
    stmt = select(Match).where(
        or_(
            Match.user1_id == user_id,
            Match.user2_id == user_id
        )
    )
    matches = db.session.execute(stmt).scalars().all()

    # 2) Para cada match, quedarnos solo con el “otro” usuario,
    #    serializar sus datos si tiene Profile, o “user has no data” en caso contrario.
    other_users = []
    for m in matches:
        # Determinar cuál es el usuario contrario al pas ado en la URL
        if m.user1_id == user_id:
            u = m.user2
        else:
            u = m.user1

        # Si el User tiene Profile, devolvemos un dict similar al de Match.serialize() pero solo con ese user
        if u.profile:
            other_users.append({
                "user_id":  u.id,
                "nickname": u.profile.nick_name if u.profile.nick_name else "undefined",
                "photo":    u.profile.photo    if u.profile.photo    else "photo1",
                "games":    [g.serialize() for g in u.profile.games] if u.profile.games else [],
                "gender":   u.profile.gender   if u.profile.gender   else "undefined",
                "age":      u.profile.age      if u.profile.age      else "undefined",
                "location": u.profile.location if u.profile.location else "undefined",
            })
        else:
            other_users.append(f" user with id {u.id} has no data")

    # 3) (Opcional) Eliminar duplicados por user_id, si no quieres que el mismo usuario aparezca varias veces:
    unique_dict = {}
    deduped = []
    for item in other_users:
        if isinstance(item, dict):
            uid = item["user_id"]
            if uid not in unique_dict:
                unique_dict[uid] = item
                deduped.append(item)
        else:
            # Si es la cadena "user has no data", la dejamos tal cual (o podrías filtrarla)
            deduped.append(item)

    # 4) Devuelvo la lista final de “otros” usuarios
    return jsonify({"matches": deduped}), 200


# DELETE A MATCH
@api.route('/matches/<int:match_id>', methods=['DELETE'])
@jwt_required()
def delete_match(match_id):
    stmt = select(Match).where(Match.id == match_id)
    match = db.session.execute(stmt).scalar_one_or_none()
    if not match:
        return jsonify({'error': f'Match with id {match_id} not found'}), 404
    requesting_id = int(get_jwt_identity())
    if match.user1_id != requesting_id and match.user2_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(match)
    db.session.commit()
    return jsonify({'message': f'Match {match_id} deleted'}), 200


# GET ALL REJECT
@api.route('/rejects', methods=['GET'])
@admin_required
def get_all_rejects():
    stmt = select(Reject)
    rejects = db.session.execute(stmt).scalars().all()
    return jsonify([reject.serialize() for reject in rejects]), 200


# GET REJECT BY ID
@api.route('/rejects/<int:reject_id>', methods=['GET'])
def get_single_reject(reject_id):
    stmt = select(Reject).where(Reject.id == reject_id)
    reject = db.session.execute(stmt).scalar_one_or_none()
    if reject is None:
        return jsonify({'error': f'reject with id: {reject_id} not found'}), 404
    return jsonify(reject.serialize()), 200

# GET REJECTS SENT


@api.route('/rejects_sent/<int:user_id>', methods=['GET'])
def get_rejects_sent(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 404
    serialized = [reject.serialize() for reject in user.rejects_given]
    return jsonify({"rejects_authored": serialized}), 200

# GET REJECTS RECEIVED


@api.route('/rejects_received/<int:user_id>', methods=['GET'])
def get_rejects_received(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 404
    serialized = [reject.serialize() for reject in user.rejects_received]
    return jsonify({"rejects_received": serialized}), 200

# DELETE REJECT


@api.route('/rejects/<int:reject_id>', methods=['DELETE'])
@jwt_required()
def delete_reject(reject_id):
    stmt = select(Reject).where(Reject.id == reject_id)
    reject = db.session.execute(stmt).scalar_one_or_none()
    if reject is None:
        return jsonify({'error': f'reject with id: {reject_id} not found'}), 404
    requesting_id = int(get_jwt_identity())
    if reject.rejector_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(reject)
    db.session.commit()
    return jsonify({'message': f'reject with id: {reject_id} deleted'}), 200


# POST REJECT
@api.route('/rejects/<int:rejector_id>/<int:rejected_id>', methods=['POST'])
@jwt_required()
def post_reject(rejector_id, rejected_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != rejector_id:
        return jsonify({'error': 'Unauthorized'}), 403
    rejector = db.session.get(User, rejector_id)
    if rejector is None:
        return jsonify({'error': f'User (rejector) with id={rejector_id} not found'}), 404

    rejected = db.session.get(User, rejected_id)
    if rejected is None:
        return jsonify({'error': f'User (rejected) with id={rejected_id} not found'}), 404

    if rejector_id == rejected_id:
        return jsonify({'error': 'Cannot match with yourself'}), 400

    existing = (db.session.query(Reject).filter_by(
        rejector_id=rejector_id, rejected_id=rejected_id).first())
    if existing:
        return jsonify({'error': 'Reject already exists'}), 409

    # 4. Crear y persistir el nuevo reject
    new_reject = Reject(rejector_id=rejector_id, rejected_id=rejected_id)
    db.session.add(new_reject)
    db.session.commit()

    # 5. Responder con 201 Created y los datos del match
    return jsonify(new_reject.serialize()), 201


# GET ALL GAMES
@api.route('/games', methods=['GET'])
@admin_required
def get_all_games():
    stmt = select(Game)
    games = db.session.execute(stmt).scalars().all()
    return jsonify([game.serialize() for game in games]), 200

# GET SINGLE GAME
@api.route('/games/<int:game_id>', methods=['GET'])
def get_single_game(game_id):
    stmt = select(Game).where(Game.id == game_id)
    game = db.session.execute(stmt).scalar_one_or_none()
    if game is None:
        return jsonify({'error': f'game with id {game_id} not found'}), 404
    return jsonify(game.serialize()), 200


# GET GAMES BY PROFILE ID
@api.route('/games_by_profile/<int:profile_id>', methods=['GET'])
def get_games_by_profile_id(profile_id):
    # 1. Ejecutar la consulta
    stmt = select(Game).where(Game.profile_id == profile_id)
    games = db.session.execute(stmt).scalars().all()

    # 2. Si no hay resultados, podemos devolver 404 o una lista vacía.
    if not games:
        return jsonify({'error': 'No se han encontrado juegos para este perfil'}), 404

    # 3. Serializar y devolver la lista
    serialized = [game.serialize() for game in games]
    return jsonify(serialized), 200

# PUT A GAME HOURS


@api.route('/games/hours/<int:game_id>', methods=['PUT'])
@jwt_required()
def put_game_hours(game_id):
    requesting_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No se están enviando los datos correctamente'}), 400

    # Buscar juego
    stmt = select(Game).where(Game.id == game_id)
    game = db.session.execute(stmt).scalar_one_or_none()

    if game is None:
        return jsonify({'error': 'Este juego no existe'}), 404

    if game.profile.user_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Actualizar los valores
    game.game_hoursPlayed = int(data.get("hours_played") or 0)

    # Guardar cambios
    db.session.commit()

    return jsonify(game.serialize()), 200


# POST GAMES
@api.route('/games/<int:profile_id>', methods=['POST'])
@jwt_required()
def post_game(profile_id):
    requesting_id = int(get_jwt_identity())
    # Verify ownership: the profile must belong to the requesting user
    profile = db.session.get(Profile, profile_id)
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    if profile.user_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403
    # 1) Asegurarnos de que el Content-Type sea application/json
    if not request.is_json:
        return jsonify({'error': 'Se requiere Content-Type: application/json'}), 400

    data = request.get_json()

    # 2) Validar que venga la clave "game"
    if not data:
        return jsonify({'error': 'Falta el campo "game" en el JSON'}), 400

    new_game = Game(
        profile_id=profile_id,
        game_hoursPlayed=int(data.get('hours_played') or 0),
        game_image=data.get('image') or 'default.jpg',
        game_title=data.get('title') or 'Unknown',
    )
    db.session.add(new_game)
    db.session.commit()

    return jsonify(new_game.serialize()), 201


# DELETE GAME
@api.route('/games/<int:game_id>', methods=['DELETE'])
@jwt_required()
def delete_game(game_id):
    stmt = select(Game).where(Game.id == game_id)
    game = db.session.execute(stmt).scalar_one_or_none()
    if game is None:
        return jsonify({'error': f'game with id: {game_id} not found'}), 404
    requesting_id = int(get_jwt_identity())
    if game.profile.user_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(game)
    db.session.commit()
    return jsonify({'message': f'game with id: {game_id} deleted'}), 200


# GET ALL LIKES
@api.route('/likes', methods=['GET'])
@admin_required
def get_all_likes():
    stmt = select(Like)
    likes = db.session.execute(stmt).scalars().all()
    return jsonify([like.serialize() for like in likes]), 200


# GET BY LIKE ID
@api.route('/likes/<int:like_id>', methods=['GET'])
def get_single_like(like_id):
    stmt = select(Like).where(Like.id == like_id)
    like = db.session.execute(stmt).scalar_one_or_none()
    if not like:
        return jsonify({'error': f'Like with id {like_id} not found'}), 404
    return jsonify(like.serialize()), 200

# POST LIKE (crea el Match automáticamente si hay like mutuo)
@api.route('/likes/<int:liker_id>/<int:liked_id>', methods=['POST'])
@jwt_required()
def post_like(liker_id, liked_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != liker_id:
        return jsonify({'error': 'Unauthorized'}), 403
    # No se permite que un usuario se de like a sí mismo
    if liker_id == liked_id:
        return jsonify({'error': 'Cannot like yourself'}), 400

    # Obtener usuarios de la base de datos
    liker = db.session.get(User, liker_id)
    liked = db.session.get(User, liked_id)
    if not liker or not liked:
        return jsonify({'error': 'User not found'}), 404

    # Evitar likes duplicados
    existing_like = (db.session.query(Like)
                     .filter_by(liker_id=liker_id, liked_id=liked_id)
                     .first())
    if existing_like:
        return jsonify({'error': 'Like already exists'}), 409

    # Verificar like inverso para crear match
    reverse_like = (db.session.query(Like)
                    .filter_by(liker_id=liked_id, liked_id=liker_id)
                    .first())

    # Crear el nuevo like
    new_like = Like(liker_id=liker_id, liked_id=liked_id)
    db.session.add(new_like)

    # Si existe el like inverso y no existe aún el match, crear match
    match_created = None
    if reverse_like:
        existing_match = (db.session.query(Match)
                          .filter(
                              ((Match.user1_id == liker_id) & (Match.user2_id == liked_id)) |
                              ((Match.user1_id == liked_id) &
                               (Match.user2_id == liker_id))
        )
            .first())
        if not existing_match:
            new_match = Match(user1_id=liker_id, user2_id=liked_id)
            db.session.add(new_match)
            match_created = new_match

    # Confirmar cambios en la base
    db.session.commit()

    # Construir respuesta con datos del match si fue creado
    if match_created:
        other = liked  # el usuario que recibió el like (el que ya nos había dado like)
        match_profile = None
        if other.profile:
            match_profile = {
                "user_id": other.id,
                "nick_name": other.profile.nick_name or other.profile.name or "undefined",
                "photo": other.profile.photo or "photo1",
                "name": other.profile.name or "undefined",
                "age": other.profile.age,
                "location": other.profile.location or "undefined",
                "discord": other.profile.discord or "undefined",
                "games": [g.serialize() for g in other.profile.games] if other.profile.games else [],
            }
        return jsonify({
            "is_match": True,
            "match_id": match_created.id,
            "match_profile": match_profile,
            "like": new_like.serialize()
        }), 201

    return jsonify({"is_match": False, "like": new_like.serialize()}), 201


# DELETE LIKE (ESTÁ LA LÓGICA PARA QUE SE BORRE EL MATCH SI ES NECESARIO)
@api.route('/likes/<int:like_id>', methods=['DELETE'])
@jwt_required()
def delete_like(like_id):
    # Buscar el like
    like = db.session.get(Like, like_id)
    if not like:
        return jsonify({'error': f'Like with id {like_id} not found'}), 404
    requesting_id = int(get_jwt_identity())
    if like.liker_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Comprobar si este like formó parte de un match
    match = (db.session.query(Match)
             .filter(
                 ((Match.user1_id == like.liker_id) & (Match.user2_id == like.liked_id)) |
                 ((Match.user1_id == like.liked_id) &
                  (Match.user2_id == like.liker_id))
    )
        .first())

    # Si hay match, borrarlo
    if match:
        db.session.delete(match)

    # Borrar el like
    db.session.delete(like)
    db.session.commit()

    return jsonify({'message': f'Like {like_id} deleted, match removed' if match else f'Like {like_id} deleted'}), 200


# ════════════════════════════════════════════════════════════════════════════
# CHAT — REST polling (no WebSockets required)
# ════════════════════════════════════════════════════════════════════════════

def _assert_match_member(match, user_id: int):
    """Returns (match, None) if ok, or (None, error_response) if unauthorized."""
    if match.user1_id != user_id and match.user2_id != user_id:
        return None, (jsonify({'error': 'Unauthorized: you are not part of this match'}), 403)
    return match, None


# GET /api/chat/messages/<match_id>
# Returns last 50 messages; marks incoming messages as read.
@api.route('/chat/messages/<int:match_id>', methods=['GET'])
@jwt_required()
def get_chat_messages(match_id):
    user_id = int(get_jwt_identity())

    match = db.session.get(Match, match_id)
    if not match:
        return jsonify({'error': f'Match {match_id} not found'}), 404

    match, err = _assert_match_member(match, user_id)
    if err:
        return err

    # Last 50 messages ordered ascending for display
    messages = (
        db.session.query(ChatMessage)
        .filter(ChatMessage.match_id == match_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(50)
        .all()
    )
    messages = list(reversed(messages))

    # Mark unread messages from the OTHER user as read
    (
        db.session.query(ChatMessage)
        .filter(
            ChatMessage.match_id == match_id,
            ChatMessage.sender_id != user_id,
            ChatMessage.read == False,          # noqa: E712
        )
        .update({'read': True}, synchronize_session=False)
    )
    db.session.commit()

    return jsonify([m.serialize() for m in messages]), 200


# POST /api/chat/messages/<match_id>
# Send a new message.
@api.route('/chat/messages/<int:match_id>', methods=['POST'])
@jwt_required()
def post_chat_message(match_id):
    user_id = int(get_jwt_identity())

    match = db.session.get(Match, match_id)
    if not match:
        return jsonify({'error': f'Match {match_id} not found'}), 404

    match, err = _assert_match_member(match, user_id)
    if err:
        return err

    data = request.get_json()
    content = (data or {}).get('content', '').strip()

    if not content:
        return jsonify({'error': 'El mensaje no puede estar vacío'}), 400
    if len(content) > 500:
        return jsonify({'error': 'El mensaje no puede superar los 500 caracteres'}), 400

    msg = ChatMessage(match_id=match_id, sender_id=user_id, content=content)
    db.session.add(msg)
    db.session.commit()

    return jsonify(msg.serialize()), 201


# GET /api/chat/messages/unread/count
# Returns total unread messages across all matches for the authenticated user.
@api.route('/chat/messages/unread/count', methods=['GET'])
@jwt_required()
def get_unread_count():
    user_id = int(get_jwt_identity())

    # All match IDs where this user is a participant
    match_ids = (
        db.session.query(Match.id)
        .filter(
            (Match.user1_id == user_id) | (Match.user2_id == user_id)
        )
        .all()
    )
    match_ids = [m.id for m in match_ids]

    if not match_ids:
        return jsonify({'unread': 0}), 200

    count = (
        db.session.query(ChatMessage)
        .filter(
            ChatMessage.match_id.in_(match_ids),
            ChatMessage.sender_id != user_id,
            ChatMessage.read == False,          # noqa: E712
        )
        .count()
    )
    return jsonify({'unread': count}), 200


# GET /api/chat/preview/<user_id>
# Returns list of matches with last message + unread count per match.
# Used by the Chats list page.
@api.route('/chat/preview/<int:user_id>', methods=['GET'])
@jwt_required()
def get_chat_preview(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    stmt = select(Match).where(
        (Match.user1_id == user_id) | (Match.user2_id == user_id)
    )
    matches = db.session.execute(stmt).scalars().all()

    result = []
    for m in matches:
        other = m.user2 if m.user1_id == user_id else m.user1

        last_msg = (
            db.session.query(ChatMessage)
            .filter(ChatMessage.match_id == m.id)
            .order_by(ChatMessage.created_at.desc())
            .first()
        )

        unread = (
            db.session.query(ChatMessage)
            .filter(
                ChatMessage.match_id == m.id,
                ChatMessage.sender_id != user_id,
                ChatMessage.read == False,      # noqa: E712
            )
            .count()
        )

        result.append({
            'match_id':      m.id,
            'other_user_id': other.id,
            'nickname':      other.profile.nick_name if other.profile else 'Sin nick',
            'photo':         other.profile.photo    if other.profile else None,
            'last_message':  last_msg.serialize()   if last_msg else None,
            'unread':        unread,
        })

    # Sort by last message timestamp, most recent first; matches with no messages go last
    result.sort(
        key=lambda x: x['last_message']['created_at'] if x['last_message'] else '',
        reverse=True,
    )
    return jsonify(result), 200


# ══════════════════════════════════════════════════════════════════════════════
# FIND-GAMES AI — Claude + MCP Tools
# ══════════════════════════════════════════════════════════════════════════════

AI_TOOLS = [
    {
        "name": "get_user_profile",
        "description": (
            "Obtiene el perfil completo del usuario actual: nickname, edad, género, "
            "juegos con horas jugadas, preferencias de juego y ubicación. "
            "Úsala cuando el usuario pregunte sobre sus propios datos "
            "o cuando necesites contexto para hacer recomendaciones personalizadas. "
            "NO necesitas proporcionar user_id, se obtiene automáticamente de la sesión."
        ),
        "input_schema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "search_games_catalog",
        "description": (
            "Busca juegos en el catálogo de PlayerLink por nombre, género o características. "
            "Úsala cuando el usuario pida recomendaciones de juegos "
            "o quiera saber qué juegos hay disponibles en la plataforma."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Término de búsqueda: nombre, género, o descripción"
                },
                "limit": {
                    "type": "integer",
                    "description": "Número máximo de resultados (default: 5)",
                    "default": 5
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_compatible_players",
        "description": (
            "Encuentra jugadores en PlayerLink compatibles con el usuario actual "
            "basándose en juegos en común y preferencias similares. "
            "Úsala cuando el usuario pregunte por posibles matches o compañeros de juego. "
            "NO necesitas proporcionar user_id, se obtiene automáticamente de la sesión."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Número de jugadores a devolver (default: 3)",
                    "default": 3
                }
            }
        }
    },
    {
        "name": "get_game_community_stats",
        "description": (
            "Obtiene estadísticas de un juego específico dentro de la comunidad PlayerLink: "
            "cuántos jugadores lo tienen, media de horas jugadas, top jugadores más activos. "
            "Úsala cuando el usuario pregunte por la popularidad de un juego en la plataforma."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "game_title": {
                    "type": "string",
                    "description": "Nombre exacto o aproximado del juego"
                }
            },
            "required": ["game_title"]
        }
    },
    {
        "name": "get_user_matches",
        "description": (
            "Obtiene los matches actuales del usuario: con quién ha hecho match, "
            "juegos que tienen en común y cuándo se produjo el match. "
            "Úsala cuando el usuario pregunte por sus matches actuales. "
            "NO necesitas proporcionar user_id, se obtiene automáticamente de la sesión."
        ),
        "input_schema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "get_platform_stats",
        "description": (
            "Obtiene estadísticas generales de la plataforma PlayerLink: "
            "número total de usuarios registrados, perfiles creados, matches realizados "
            "y juegos más populares de la comunidad. "
            "Úsala cuando el usuario pregunte cuántos usuarios hay, cómo está creciendo "
            "la plataforma o qué juegos son los más jugados en general."
        ),
        "input_schema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "send_message_to_match",
        "description": (
            "Envía un mensaje de chat real en nombre del usuario a uno de sus matches. "
            "Úsala cuando el usuario pida que le escribas a un match, por ejemplo: "
            "'envíale un mensaje a CrystalWitch para quedar a jugar', "
            "'escríbele a mi mejor match para coordinar una partida', "
            "'mándale un mensaje a TurboBeast42 proponiéndole jugar Elden Ring'. "
            "IMPORTANTE: Antes de enviar, usa get_user_matches para saber el match_id correcto. "
            "Siempre informa al usuario exactamente qué mensaje vas a enviar y a quién, y pide confirmación si hay ambigüedad."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "match_id": {
                    "type": "integer",
                    "description": "ID del match al que enviar el mensaje"
                },
                "message": {
                    "type": "string",
                    "description": "Texto del mensaje a enviar (máximo 500 caracteres). Redáctalo de forma natural, como si lo escribiera el propio usuario."
                }
            },
            "required": ["match_id", "message"]
        }
    },
    {
        "name": "update_user_profile",
        "description": (
            "Actualiza los campos del perfil del usuario actual. "
            "Úsala cuando el usuario pida rellenar, completar o actualizar su perfil automáticamente. "
            "NO necesitas user_id, se obtiene automáticamente. "
            "CAMPOS para un perfil completo (todos importantes): name (nombre real), nick_name (gamertag), "
            "bio (descripción), age (edad), gender (género), zodiac (signo del zodiaco), "
            "discord (usuario Discord), steam_id (Steam Friend ID), language (idiomas), "
            "preferences (estilo de juego), location (ciudad y país). "
            "FLUJO para completar perfil: 1) usa get_user_profile para ver qué campos están vacíos, "
            "2) pregunta al usuario los datos que faltan de forma conversacional (agrupa preguntas relacionadas), "
            "3) muestra un resumen de lo que vas a guardar y pide confirmación, "
            "4) ejecuta update_user_profile solo con los campos confirmados. "
            "Todos los campos son opcionales — solo actualiza los que el usuario proporcione. "
            "Campos disponibles: name, nick_name, age, gender, location, zodiac, discord, steam_id, language, preferences, bio, photo (photo1-photo9)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "name":        {"type": "string",  "description": "Nombre real del usuario (campo clave para perfil completo)"},
                "nick_name":   {"type": "string",  "description": "Nickname o gamertag (máx 21 caracteres) (campo clave para perfil completo)"},
                "age":         {"type": "integer", "description": "Edad del usuario"},
                "gender":      {"type": "string",  "description": "Género: 'Masculino', 'Femenino', 'No binario', 'Prefiero no decirlo'"},
                "location":    {"type": "string",  "description": "Ciudad y país, ej: 'Madrid, España'"},
                "zodiac":      {"type": "string",  "description": "Signo zodiacal (campo clave para perfil completo), ej: 'Aries', 'Tauro', 'Géminis'..."},
                "discord":     {"type": "string",  "description": "Usuario de Discord, ej: 'nick#1234'"},
                "steam_id":    {"type": "string",  "description": "Steam Friend ID o URL de perfil de Steam (campo clave para perfil completo)"},
                "language":    {"type": "string",  "description": "Idiomas separados por coma, ej: 'Español, Inglés'"},
                "preferences": {"type": "string",  "description": "Estilo de juego, ej: 'Competitivo, Nocturno, Estratégico'"},
                "bio":         {"type": "string",  "description": "Descripción personal del jugador (máx 500 caracteres)"},
                "photo":       {"type": "string",  "description": "Avatar: 'photo1' a 'photo9'"}
            }
        }
    },
    {
        "name": "add_game_to_profile",
        "description": (
            "Añade un juego al perfil del usuario con las horas jugadas. "
            "Úsala cuando el usuario quiera añadir juegos a su perfil automáticamente. "
            "Si el juego ya existe en el perfil, informa al usuario y no lo dupliques. "
            "NO necesitas user_id, se obtiene automáticamente."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "game_title": {
                    "type": "string",
                    "description": "Título exacto del juego, ej: 'Valorant', 'Elden Ring'"
                },
                "hours_played": {
                    "type": "integer",
                    "description": "Horas jugadas aproximadas"
                }
            },
            "required": ["game_title", "hours_played"]
        }
    }
]


# ── Tool executors ────────────────────────────────────────────────────────────

def _execute_get_user_profile(user_id):
    """Devuelve el perfil completo del usuario desde la BD."""
    try:
        user = db.session.get(User, user_id)
        if not user or not user.profile:
            return {"error": "Profile not found"}

        p = user.profile
        games_data = [
            {
                "title": g.game_title,
                "hours": g.game_hoursPlayed,
                "image": g.game_image
            }
            for g in (p.games or [])
        ]

        return {
            "nickname": p.nick_name,
            "age": p.age,
            "gender": p.gender,
            "location": p.location,
            "preferences": p.preferences,
            "bio": p.bio,
            "language": p.language,
            "discord": p.discord,
            "games": games_data,
            "total_games": len(games_data)
        }
    except Exception as e:
        return {"error": str(e)}


_GAMES_CATALOG = [
    {"title": "Valorant",              "genre": "FPS Táctico",            "platform": "PC"},
    {"title": "CS2",                   "genre": "FPS Táctico",            "platform": "PC"},
    {"title": "Apex Legends",          "genre": "Battle Royale",          "platform": "PC/Console"},
    {"title": "Overwatch 2",           "genre": "FPS Hero Shooter",       "platform": "PC/Console"},
    {"title": "League of Legends",     "genre": "MOBA",                   "platform": "PC"},
    {"title": "Dota 2",                "genre": "MOBA",                   "platform": "PC"},
    {"title": "Fortnite",              "genre": "Battle Royale",          "platform": "PC/Console/Mobile"},
    {"title": "Elden Ring",            "genre": "Action RPG",             "platform": "PC/Console"},
    {"title": "Cyberpunk 2077",        "genre": "Action RPG",             "platform": "PC/Console"},
    {"title": "The Witcher 3",         "genre": "Action RPG",             "platform": "PC/Console"},
    {"title": "Baldur's Gate 3",       "genre": "RPG",                    "platform": "PC/Console"},
    {"title": "God of War",            "genre": "Action Adventure",       "platform": "PC/Console"},
    {"title": "Hollow Knight",         "genre": "Metroidvania",           "platform": "PC/Console"},
    {"title": "Hades",                 "genre": "Roguelike",              "platform": "PC/Console"},
    {"title": "Dead Cells",            "genre": "Roguelike",              "platform": "PC/Console"},
    {"title": "Minecraft",             "genre": "Sandbox/Survival",       "platform": "PC/Console/Mobile"},
    {"title": "Terraria",              "genre": "Sandbox/Survival",       "platform": "PC/Console"},
    {"title": "Valheim",               "genre": "Survival/Co-op",         "platform": "PC"},
    {"title": "Deep Rock Galactic",    "genre": "Co-op Shooter",          "platform": "PC/Console"},
    {"title": "It Takes Two",          "genre": "Co-op Adventure",        "platform": "PC/Console"},
    {"title": "Helldivers 2",          "genre": "Co-op Shooter",          "platform": "PC/Console"},
    {"title": "Stardew Valley",        "genre": "Farming Sim",            "platform": "PC/Console/Mobile"},
    {"title": "Monster Hunter: World", "genre": "Action RPG/Co-op",       "platform": "PC/Console"},
    {"title": "Destiny 2",             "genre": "MMO Shooter",            "platform": "PC/Console"},
    {"title": "Warframe",              "genre": "MMO Shooter",            "platform": "PC/Console"},
    {"title": "Path of Exile",         "genre": "Action RPG",             "platform": "PC/Console"},
    {"title": "Diablo IV",             "genre": "Action RPG",             "platform": "PC/Console"},
    {"title": "Celeste",               "genre": "Platformer",             "platform": "PC/Console"},
    {"title": "Cuphead",               "genre": "Run and Gun",            "platform": "PC/Console"},
    {"title": "Slay the Spire",        "genre": "Roguelike Deck Builder", "platform": "PC/Console"},
]


def _execute_search_games_catalog(query, limit=5):
    """Busca en el catálogo de juegos integrado por similitud de nombre/género."""
    GAMES_CATALOG = _GAMES_CATALOG

    try:
        q = query.lower()
        results = []
        for game in GAMES_CATALOG:
            score = 0
            if q in game["title"].lower():
                score += 3
            if q in game["genre"].lower():
                score += 2
            if q in game["platform"].lower():
                score += 1
            if score > 0:
                results.append({**game, "relevance": score})

        if not results:
            results = [dict(g) for g in GAMES_CATALOG[:limit]]
        else:
            results.sort(key=lambda x: x["relevance"], reverse=True)

        return {
            "query": query,
            "results": results[:limit],
            "total_found": len(results)
        }
    except Exception as e:
        return {"error": str(e)}


def _execute_get_compatible_players(user_id, limit=3):
    """Encuentra jugadores con juegos en común en la BD."""
    try:
        current_user = db.session.get(User, user_id)
        if not current_user or not current_user.profile:
            return {"error": "User profile not found"}

        current_games = {g.game_title for g in (current_user.profile.games or []) if g.game_title}

        # IDs de usuarios ya muteados/rechazados (opcional — mejora la calidad)
        all_profiles = db.session.query(Profile).filter(
            Profile.user_id != user_id
        ).limit(100).all()

        compatible = []
        for profile in all_profiles:
            if not profile.nick_name:
                continue
            profile_games = {g.game_title for g in (profile.games or []) if g.game_title}
            games_in_common = current_games & profile_games
            if games_in_common:
                compatible.append({
                    "nickname": profile.nick_name,
                    "games_in_common": list(games_in_common),
                    "common_count": len(games_in_common),
                    "location": profile.location or "Desconocida",
                    "preferences": profile.preferences or "No especificadas"
                })

        compatible.sort(key=lambda x: x["common_count"], reverse=True)

        return {
            "compatible_players": compatible[:limit],
            "total_found": len(compatible),
            "your_games": list(current_games)
        }
    except Exception as e:
        return {"error": str(e)}


def _execute_get_game_community_stats(game_title):
    """Estadísticas de un juego en la comunidad PlayerLink desde la BD."""
    try:
        games = db.session.query(Game).filter(
            Game.game_title.ilike(f"%{game_title}%")
        ).all()

        if not games:
            return {
                "game": game_title,
                "players_count": 0,
                "message": "Este juego aún no tiene jugadores registrados en PlayerLink"
            }

        total_hours = sum(int(g.game_hoursPlayed or 0) for g in games)
        avg_hours = total_hours / len(games) if games else 0

        top_players = sorted(games, key=lambda g: g.game_hoursPlayed or 0, reverse=True)[:3]

        return {
            "game": game_title,
            "players_count": len(games),
            "total_hours_played": total_hours,
            "average_hours": round(avg_hours, 1),
            "top_players": [
                {
                    "nickname": g.profile.nick_name if g.profile else "Desconocido",
                    "hours": g.game_hoursPlayed
                }
                for g in top_players
            ]
        }
    except Exception as e:
        return {"error": str(e)}


def _execute_get_user_matches(user_id):
    """Obtiene los matches del usuario y los juegos que comparte con cada match."""
    try:
        matches = db.session.query(Match).filter(
            or_(Match.user1_id == user_id, Match.user2_id == user_id)
        ).limit(15).all()

        current_user = db.session.get(User, user_id)
        my_games = set()
        if current_user and current_user.profile:
            my_games = {g.game_title for g in (current_user.profile.games or []) if g.game_title}

        matches_data = []
        for match in matches:
            other_id = match.user2_id if match.user1_id == user_id else match.user1_id
            other_user = db.session.get(User, other_id)

            if other_user and other_user.profile:
                other_games = {g.game_title for g in (other_user.profile.games or []) if g.game_title}
                matches_data.append({
                    "match_id": match.id,
                    "nickname": other_user.profile.nick_name or "Sin nick",
                    "games_in_common": list(my_games & other_games),
                    "location": other_user.profile.location or "Desconocida",
                    "matched_at": match.created_at.isoformat() if match.created_at else None
                })

        return {
            "total_matches": len(matches_data),
            "matches": matches_data
        }
    except Exception as e:
        return {"error": str(e)}


def _execute_update_user_profile(user_id, fields: dict):
    """Actualiza los campos del perfil del usuario directamente en la BD."""
    try:
        user = db.session.get(User, user_id)
        if not user or not user.profile:
            return {"error": "Perfil no encontrado"}

        p = user.profile
        ALLOWED = {
            "name", "nick_name", "age", "gender", "location",
            "zodiac", "discord", "steam_id", "language", "preferences", "bio", "photo"
        }
        updated = {}
        for key, value in fields.items():
            if key not in ALLOWED:
                continue
            if value is None:
                continue
            # Validaciones básicas
            if key == "nick_name" and len(str(value)) > 21:
                return {"error": f"El nick_name no puede superar 21 caracteres (recibido: {len(str(value))})"}
            if key == "bio" and len(str(value)) > 500:
                return {"error": f"La bio no puede superar 500 caracteres"}
            if key == "age" and (not isinstance(value, int) or value < 10 or value > 99):
                return {"error": f"La edad debe ser un número entre 10 y 99"}
            if key == "photo" and str(value) not in [f"photo{i}" for i in range(1, 10)]:
                return {"error": f"Foto inválida. Usa photo1-photo9"}
            if key == "steam_id":
                setattr(p, "steam_id", str(value))
            else:
                setattr(p, key, value)
            updated[key] = value

        if not updated:
            return {"error": "No se proporcionaron campos válidos para actualizar"}

        db.session.commit()
        return {
            "success": True,
            "updated_fields": updated,
            "profile_updated": True,
            "message": f"Perfil actualizado correctamente. Campos modificados: {', '.join(updated.keys())}"
        }
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}


def _execute_add_game_to_profile(user_id, game_title: str, hours_played: int):
    """Añade un juego al perfil del usuario."""
    try:
        user = db.session.get(User, user_id)
        if not user or not user.profile:
            return {"error": "Perfil no encontrado"}

        profile_id = user.profile.id

        # Comprobar duplicados
        existing = db.session.query(Game).filter(
            Game.profile_id == profile_id,
            Game.game_title.ilike(game_title)
        ).first()
        if existing:
            return {
                "error": f"'{game_title}' ya está en tu perfil ({existing.game_hoursPlayed} horas). "
                         "Usa la app para editar las horas si quieres actualizarlas."
            }

        # Buscar imagen en el catálogo
        game_image = "default.jpg"
        try:
            catalog = _GAMES_CATALOG
            for entry in catalog:
                if entry.get("title", "").lower() == game_title.lower():
                    game_image = entry.get("image", "default.jpg")
                    break
        except Exception:
            pass

        new_game = Game(
            profile_id=profile_id,
            game_title=game_title,
            game_hoursPlayed=hours_played,
            game_image=game_image
        )
        db.session.add(new_game)
        db.session.commit()

        return {
            "success": True,
            "game_added": game_title,
            "hours": hours_played,
            "profile_updated": True,
            "message": f"'{game_title}' añadido a tu perfil con {hours_played} horas."
        }
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}


def _execute_send_message_to_match(match_id, message, user_id):
    """Envía un mensaje real de chat al match indicado en nombre del usuario."""
    try:
        if not message or not message.strip():
            return {"error": "El mensaje no puede estar vacío"}
        if len(message) > 500:
            return {"error": "El mensaje supera los 500 caracteres"}

        # Verificar que el match existe y el usuario es miembro
        match = db.session.get(Match, match_id)
        if not match:
            return {"error": f"Match {match_id} no encontrado"}
        if match.user1_id != user_id and match.user2_id != user_id:
            return {"error": "No tienes acceso a este match"}

        # Obtener nickname del destinatario para el feedback
        other_id = match.user2_id if match.user1_id == user_id else match.user1_id
        other_user = db.session.get(User, other_id)
        other_nick = other_user.profile.nick_name if other_user and other_user.profile else f"usuario {other_id}"

        msg = ChatMessage(match_id=match_id, sender_id=user_id, content=message.strip())
        db.session.add(msg)
        db.session.commit()

        return {
            "success": True,
            "message_sent": message.strip(),
            "sent_to": other_nick,
            "match_id": match_id,
            "message_id": msg.id
        }
    except Exception as e:
        return {"error": str(e)}


def _execute_get_platform_stats():
    """Estadísticas generales de la plataforma PlayerLink."""
    try:
        total_users = db.session.query(User).count()
        total_profiles = db.session.query(Profile).count()
        total_matches = db.session.query(Match).count()

        top_games_query = db.session.query(
            Game.game_title,
            db.func.count(Game.id).label("players")
        ).group_by(Game.game_title).order_by(db.func.count(Game.id).desc()).limit(5).all()

        return {
            "total_users": total_users,
            "total_profiles": total_profiles,
            "total_matches": total_matches,
            "top_games": [{"title": g.game_title, "players": g.players} for g in top_games_query]
        }
    except Exception as e:
        return {"error": str(e)}


def _dispatch_tool(tool_name, tool_input, user_id):
    """Ejecuta la tool solicitada por Claude e inyecta user_id automáticamente."""
    dispatchers = {
        "get_user_profile":        lambda: _execute_get_user_profile(user_id),
        "search_games_catalog":    lambda: _execute_search_games_catalog(
            tool_input.get("query", ""),
            tool_input.get("limit", 5)
        ),
        "get_compatible_players":  lambda: _execute_get_compatible_players(
            user_id,
            tool_input.get("limit", 3)
        ),
        "get_game_community_stats": lambda: _execute_get_game_community_stats(
            tool_input.get("game_title", "")
        ),
        "get_user_matches":        lambda: _execute_get_user_matches(user_id),
        "get_platform_stats":      lambda: _execute_get_platform_stats(),
        "send_message_to_match":   lambda: _execute_send_message_to_match(
            tool_input.get("match_id"),
            tool_input.get("message", ""),
            user_id
        ),
        "update_user_profile":     lambda: _execute_update_user_profile(
            user_id,
            {k: v for k, v in tool_input.items()}
        ),
        "add_game_to_profile":     lambda: _execute_add_game_to_profile(
            user_id,
            tool_input.get("game_title", ""),
            tool_input.get("hours_played", 0)
        ),
    }
    handler = dispatchers.get(tool_name)
    if not handler:
        return {"error": f"Tool '{tool_name}' not found"}
    return handler()


# ── System prompt ─────────────────────────────────────────────────────────────

_AI_SYSTEM_PROMPT_TEMPLATE = """Eres el Game Advisor de PlayerLink, una plataforma de matchmaking para gamers.
Eres un asistente experto en videojuegos con acceso directo a los datos reales de la plataforma.

CONTEXTO DE SESIÓN:
- El usuario autenticado tiene el ID: {user_id}
- NUNCA preguntes al usuario su ID — ya lo conoces y se inyecta automáticamente en todas las tools.

Tu personalidad:
- Entusiasta, directo y amigable — como un amigo gamer que conoce todo
- Personalizas SIEMPRE tus respuestas con datos reales del usuario
- Eres conciso: máximo 3-4 párrafos por respuesta
- Si recomiendas juegos, máximo 3 por respuesta con razón clara

Tienes acceso a estas herramientas de base de datos:
- get_user_profile: perfil completo, juegos y preferencias del usuario (no necesita user_id)
- search_games_catalog: buscar juegos por género o características
- get_compatible_players: jugadores compatibles por juegos en común (no necesita user_id)
- get_game_community_stats: estadísticas de un juego en PlayerLink
- get_user_matches: matches actuales del usuario (no necesita user_id)
- get_platform_stats: estadísticas globales de la plataforma (total usuarios, matches, juegos populares)
- send_message_to_match: envía un mensaje real de chat a un match en nombre del usuario
- update_user_profile: actualiza campos del perfil (name, nick_name, age, gender, location, zodiac, discord, steam_id, language, preferences, bio, photo)
- add_game_to_profile: añade un juego con horas jugadas al perfil del usuario

REGLAS IMPORTANTES:
- Usa las tools SIEMPRE que el usuario pregunte sobre sus datos o quiera recomendaciones personalizadas
- Nunca inventes datos de la BD — usa las tools para obtener información real
- Responde en el mismo idioma que el usuario
- Si una tool devuelve error, informa amablemente al usuario
- Cuando recomiendes juegos a alguien con muchas horas en shooters, sugiere shooters similares primero
- Para preguntas sobre juegos del usuario, usa primero get_user_profile sin pedir confirmación
- Para enviar mensajes: primero usa get_user_matches para obtener el match_id correcto, luego send_message_to_match. Si el usuario menciona un nick concreto, busca ese match. Si hay ambigüedad, pregunta a cuál de sus matches quiere escribirle. Redacta el mensaje de forma natural y amigable.
- Para actualizar perfil: SIEMPRE muestra primero al usuario un resumen de qué vas a rellenar y pide confirmación explícita. Tras confirmar, ejecuta update_user_profile. Si el usuario no especifica algún campo, déjalo como está (no lo incluyas en la llamada). Puedes combinar update_user_profile y add_game_to_profile en el mismo turno si el usuario quiere añadir juegos también.
- Para COMPLETAR PERFIL (cuando el usuario pide terminar/completar/rellenar su perfil): 1) usa get_user_profile para detectar campos vacíos, 2) los campos que conforman un perfil completo son TODOS: name (nombre real), nick_name (gamertag/apodo), bio (descripción personal), age (edad), gender (género), zodiac (signo del zodiaco), discord (usuario de Discord), steam_id (Steam Friend ID o URL de Steam), preferences (estilo de juego, ej: Competitivo, Nocturno), location (ciudad y país) y language (idiomas), 3) pregunta los datos que falten de forma natural y amigable, agrupa preguntas relacionadas cuando tenga sentido (ej: "¿Cuál es tu nombre y tu gamertag?"), 4) cuando tengas todos los datos, muestra un resumen claro y pide confirmación, 5) guarda con update_user_profile.
- Para añadir juegos: usa add_game_to_profile. Puedes llamarla múltiples veces si el usuario quiere añadir varios juegos."""


# ── Endpoint principal ────────────────────────────────────────────────────────

@api.route('/ai/find-games', methods=['POST'])
@jwt_required()
def ai_find_games():
    """
    Asistente IA con MCP tools para FindGames.
    Recibe historial de mensajes, ejecuta tools de BD con Claude y devuelve respuesta.
    """
    if not anthropic_client:
        return jsonify({
            "error": "AI service not configured",
            "detail": "ANTHROPIC_API_KEY is not set in environment variables"
        }), 503

    try:
        current_user_id = int(get_jwt_identity())
        body = request.get_json()

        if not body:
            return jsonify({"error": "No body provided"}), 400

        messages_from_client = body.get('messages', [])
        if not messages_from_client:
            return jsonify({"error": "No messages provided"}), 400

        # System prompt personalizado con el user_id de la sesión
        system_prompt = _AI_SYSTEM_PROMPT_TEMPLATE.format(user_id=current_user_id)

        # Convertir formato frontend → Claude
        # Frontend: [{sender: "user"|"bot", text: "..."}]
        # Claude:   [{role: "user"|"assistant", content: "..."}]
        claude_messages = []
        for msg in messages_from_client:
            # Saltar mensajes de bienvenida del bot
            text = msg.get('text', '').strip()
            sender = msg.get('sender', '')
            if sender == 'bot' and ('Game Advisor' in text or 'PlayerLink AI' in text):
                continue
            role = 'user' if sender == 'user' else 'assistant'
            if text:
                claude_messages.append({"role": role, "content": text})

        # Garantizar que hay al menos un mensaje de usuario
        if not claude_messages:
            return jsonify({"error": "No valid messages to process"}), 400

        # Claude requiere alternancia estricta user/assistant — eliminar consecutivos del mismo rol
        filtered = []
        for msg in claude_messages:
            if filtered and filtered[-1]['role'] == msg['role']:
                # Reemplazar en lugar de duplicar (quedamos con el más reciente)
                filtered[-1] = msg
            else:
                filtered.append(msg)
        claude_messages = filtered

        # El último mensaje debe ser del usuario
        if claude_messages[-1]['role'] != 'user':
            return jsonify({"error": "Invalid message sequence — last message must be from user"}), 400

        # ── Agentic loop con tool use ──────────────────────────────────────
        max_iterations = 5
        iteration = 0
        profile_was_updated = False  # flag para notificar al frontend

        while iteration < max_iterations:
            iteration += 1

            response = anthropic_client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=system_prompt,
                tools=AI_TOOLS,
                messages=claude_messages
            )

            # Claude terminó — devolver texto al usuario
            if response.stop_reason == "end_turn":
                final_text = "".join(
                    block.text for block in response.content
                    if hasattr(block, 'text')
                )
                return jsonify({
                    "reply": final_text.strip(),
                    "profile_updated": profile_was_updated
                }), 200

            # Claude quiere usar tools
            if response.stop_reason == "tool_use":
                # Añadir respuesta de Claude (con tool_use blocks) al historial
                claude_messages.append({
                    "role": "assistant",
                    "content": response.content
                })

                # Ejecutar todas las tools solicitadas en esta ronda
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result = _dispatch_tool(block.name, block.input, current_user_id)
                        # Detectar si alguna tool actualizó el perfil
                        if isinstance(result, dict) and result.get("profile_updated"):
                            profile_was_updated = True
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": json.dumps(result, ensure_ascii=False, default=str)
                        })

                if tool_results:
                    claude_messages.append({
                        "role": "user",
                        "content": tool_results
                    })
                continue

            # stop_reason inesperado — salir del loop
            break

        return jsonify({
            "reply": "Lo siento, no pude completar la respuesta. Por favor, inténtalo de nuevo.",
            "profile_updated": profile_was_updated
        }), 200

    except _anthropic_module.APIConnectionError:
        return jsonify({"error": "No se pudo conectar con el servicio de IA. Comprueba tu conexión."}), 503
    except _anthropic_module.RateLimitError:
        return jsonify({"error": "Demasiadas peticiones al servicio de IA. Espera un momento e inténtalo de nuevo."}), 429
    except _anthropic_module.APIStatusError as e:
        print(f"[AI] Anthropic API error: {e.status_code} — {e.message}")
        return jsonify({
            "error": f"Anthropic API error {e.status_code}",
            "detail": str(e.message)
        }), 500
    except Exception as e:
        import traceback
        print(f"[AI] Unexpected error in /api/ai/find-games: {e}")
        traceback.print_exc()
        return jsonify({
            "error": "Error interno del servidor",
            "detail": str(e)
        }), 500

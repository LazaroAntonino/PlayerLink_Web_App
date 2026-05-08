"""
Profiles, Games & Reviews blueprint.
Routes: /profiles (CRUD), /games (CRUD), /reviews (CRUD),
        /profiles/profiles_to_explore
"""
from flask import Blueprint, request, jsonify
from sqlalchemy import select

from flask_jwt_extended import get_jwt_identity, jwt_required

from api.models import db, User, Profile, Review, Game
from api.utils import admin_required

profiles_bp = Blueprint('profiles', __name__)


# ── PROFILES CRUD ─────────────────────────────────────────────────────────────

@profiles_bp.route('/profiles', methods=['GET'])
@admin_required
def get_profiles():
    profiles = db.session.execute(select(Profile)).scalars().all()
    return jsonify([profile.serialize() for profile in profiles]), 200


@profiles_bp.route('/profiles/user/<int:user_id>', methods=['GET'])
def get_single_profile_by_user(user_id):
    profile = db.session.execute(
        select(Profile).where(Profile.user_id == user_id)
    ).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'Profile for user with id {user_id} not found'}), 404
    return jsonify(profile.serialize()), 200


@profiles_bp.route('/profiles/<int:profile_id>', methods=['GET'])
def get_single_profile(profile_id):
    profile = db.session.execute(
        select(Profile).where(Profile.id == profile_id)
    ).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'Profile with id {profile_id} not found'}), 404
    return jsonify(profile.serialize()), 200


@profiles_bp.route('/profiles/user/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_profile_by_user_id(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    profile = db.session.execute(
        select(Profile).where(Profile.user_id == user_id)
    ).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'Profile for user with id {user_id} not found'}), 404
    db.session.delete(profile)
    db.session.commit()
    return jsonify({'message': f'Profile of user {user_id} deleted'}), 200


@profiles_bp.route('/profiles/<int:profile_id>', methods=['DELETE'])
@jwt_required()
def delete_profile(profile_id):
    profile = db.session.execute(
        select(Profile).where(Profile.id == profile_id)
    ).scalar_one_or_none()
    if profile is None:
        return jsonify({'error': f'Profile with id {profile_id} not found'}), 404
    requesting_id = int(get_jwt_identity())
    if requesting_id != profile.user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(profile)
    db.session.commit()
    return jsonify({'message': f'Profile {profile_id} deleted'}), 200


@profiles_bp.route('/profiles/<int:user_id>', methods=['POST'])
@jwt_required()
def post_profile(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    user = db.session.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()
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


@profiles_bp.route('/profiles/<int:user_id>', methods=['PUT'])
@jwt_required()
def put_profile(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    user = db.session.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'can not find user with id: {user_id}'}), 404
    if not user.profile:
        return jsonify({'error': 'this profile do not  exist, please try to create it insted of modify one'}), 404

    def _val(key, current):
        if key not in data:
            return current
        v = data[key]
        if v == "" or v is None:
            return None
        return v

    user.profile.gender      = _val('gender',      user.profile.gender)
    user.profile.preferences = _val('preferences', user.profile.preferences)
    user.profile.zodiac      = _val('zodiac',       user.profile.zodiac)
    user.profile.discord     = _val('discord',      user.profile.discord)
    user.profile.age         = data.get('age',      user.profile.age)
    user.profile.name        = _val('name',         user.profile.name)
    user.profile.location    = _val('location',     user.profile.location)
    user.profile.nick_name   = _val('nick_name',    user.profile.nick_name)
    user.profile.bio         = _val('bio',          user.profile.bio)
    user.profile.language    = _val('language',     user.profile.language)
    user.profile.steam_id    = _val('steam_id',     user.profile.steam_id)
    user.profile.photo       = data.get('photo',    user.profile.photo) or 'photo1'

    db.session.commit()
    return jsonify(user.profile.serialize()), 200


@profiles_bp.route('/profiles/profiles_to_explore/<int:user_id>', methods=['GET'])
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

    query = (
        db.session.query(Profile)
        .join(User)
        .filter(~User.id.in_(exclude_ids))
    )

    filters_applied = {}

    game = request.args.get('game', '').strip()
    if game:
        query = (
            query
            .join(Game, Game.profile_id == Profile.id)
            .filter(Game.game_title.ilike(f'%{game}%'))
        )
        filters_applied['game'] = game

    preference = request.args.get('preference', '').strip()
    if preference:
        query = query.filter(Profile.preferences.ilike(f'%{preference}%'))
        filters_applied['preference'] = preference

    language = request.args.get('language', '').strip()
    if language:
        query = query.filter(Profile.language.ilike(f'%{language}%'))
        filters_applied['language'] = language

    location = request.args.get('location', '').strip()
    if location:
        query = query.filter(Profile.location.ilike(f'%{location}%'))
        filters_applied['location'] = location

    gender = request.args.get('gender', '').strip()
    if gender:
        query = query.filter(Profile.gender.ilike(gender))
        filters_applied['gender'] = gender

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


@profiles_bp.route('/profiles/photo/<int:user_id>', methods=['PUT'])
@jwt_required()
def put_profilephoto(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data or 'photo' not in data:
        return jsonify({'error': 'Missing data'}), 400
    user = db.session.execute(
        select(User).where(User.id == user_id)
    ).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'can not find user with id: {user_id}'}), 404
    if not user.profile:
        return jsonify({'error': 'this profile do not  exist, please try to create it insted of modify one'}), 404
    user.profile.photo = data.get('photo', user.profile.photo)
    db.session.commit()
    return jsonify(user.profile.serialize()), 200


# ── REVIEWS CRUD ──────────────────────────────────────────────────────────────

@profiles_bp.route('/reviews', methods=['GET'])
@admin_required
def get_All_Reviews():
    reviews = db.session.execute(select(Review)).scalars().all()
    return jsonify([review.serialize() for review in reviews]), 200


@profiles_bp.route('/reviews/<int:review_id>', methods=['GET'])
def get_reviews(review_id):
    review = db.session.execute(
        select(Review).where(Review.id == review_id)
    ).scalar_one_or_none()
    if review is None:
        return jsonify({'error': f'review with id: {review_id} does not exist'}), 404
    return jsonify(review.serialize()), 200


@profiles_bp.route('/reviews_authored/<int:user_id>', methods=['GET'])
def get_reviews_authored(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 404
    serialized = [
        rev.serialize() | {"stars": rev.stars, "comment": rev.comment}
        for rev in user.reviews_authored
    ]
    return jsonify({"reviews_authored": serialized}), 200


@profiles_bp.route('/reviews_received/<int:user_id>', methods=['GET'])
def get_user_reviews(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 404
    serialized = [
        rev.serialize() | {"stars": rev.stars, "comment": rev.comment}
        for rev in user.reviews_received
    ]
    return jsonify({"reviews_received": serialized}), 200


@profiles_bp.route('/reviews/<int:review_id>', methods=['DELETE'])
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


@profiles_bp.route('/reviews/<int:author_id>/<int:receiver_id>', methods=['POST'])
@jwt_required()
def post_review(author_id, receiver_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != author_id:
        return jsonify({'error': 'Unauthorized'}), 403
    if author_id == receiver_id:
        return jsonify({'error': 'No puedes comentar sobre ti mismo'}), 400

    user_author   = db.session.get(User, author_id)
    user_receiver = db.session.get(User, receiver_id)
    if user_author is None or user_receiver is None:
        return jsonify({'error': 'Usuario no encontrado'}), 404

    data = request.get_json() or {}
    if 'stars' not in data or 'comment' not in data:
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    stars = int(data['stars'])
    if not 1 <= stars <= 5:
        return jsonify({'error': '"stars" debe estar entre 1 y 5'}), 400

    comment = data['comment'].strip()
    if not comment:
        return jsonify({'error': 'El comentario no puede estar vacío'}), 400

    new_review = Review(
        user_id=receiver_id,
        author_id=author_id,
        stars=stars,
        comment=comment
    )
    db.session.add(new_review)
    db.session.commit()
    return jsonify(new_review.serialize()), 201


@profiles_bp.route('/reviews/<int:review_id>', methods=['PUT'])
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
    review.stars   = data.get('stars',   review.stars)
    review.comment = data.get('comment', review.comment)
    db.session.commit()
    return jsonify({'message': 'review updated'}), 200


# ── GAMES CRUD ────────────────────────────────────────────────────────────────

@profiles_bp.route('/games', methods=['GET'])
@admin_required
def get_all_games():
    games = db.session.execute(select(Game)).scalars().all()
    return jsonify([game.serialize() for game in games]), 200


@profiles_bp.route('/games/<int:game_id>', methods=['GET'])
def get_single_game(game_id):
    game = db.session.execute(
        select(Game).where(Game.id == game_id)
    ).scalar_one_or_none()
    if game is None:
        return jsonify({'error': f'game with id {game_id} not found'}), 404
    return jsonify(game.serialize()), 200


@profiles_bp.route('/games_by_profile/<int:profile_id>', methods=['GET'])
def get_games_by_profile_id(profile_id):
    games = db.session.execute(
        select(Game).where(Game.profile_id == profile_id)
    ).scalars().all()
    if not games:
        return jsonify({'error': 'No se han encontrado juegos para este perfil'}), 404
    return jsonify([game.serialize() for game in games]), 200


@profiles_bp.route('/games/hours/<int:game_id>', methods=['PUT'])
@jwt_required()
def put_game_hours(game_id):
    requesting_id = int(get_jwt_identity())
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No se están enviando los datos correctamente'}), 400
    game = db.session.execute(
        select(Game).where(Game.id == game_id)
    ).scalar_one_or_none()
    if game is None:
        return jsonify({'error': 'Este juego no existe'}), 404
    if game.profile.user_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403
    game.game_hoursPlayed = int(data.get("hours_played") or 0)
    db.session.commit()
    return jsonify(game.serialize()), 200


@profiles_bp.route('/games/<int:profile_id>', methods=['POST'])
@jwt_required()
def post_game(profile_id):
    requesting_id = int(get_jwt_identity())
    profile = db.session.get(Profile, profile_id)
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    if profile.user_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403
    if not request.is_json:
        return jsonify({'error': 'Se requiere Content-Type: application/json'}), 400
    data = request.get_json()
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


@profiles_bp.route('/games/<int:game_id>', methods=['DELETE'])
@jwt_required()
def delete_game(game_id):
    game = db.session.execute(
        select(Game).where(Game.id == game_id)
    ).scalar_one_or_none()
    if game is None:
        return jsonify({'error': f'game with id: {game_id} not found'}), 404
    requesting_id = int(get_jwt_identity())
    if game.profile.user_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(game)
    db.session.commit()
    return jsonify({'message': f'game with id: {game_id} deleted'}), 200

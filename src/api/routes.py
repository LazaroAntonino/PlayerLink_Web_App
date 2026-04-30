"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
import openai
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Profile, Review, Match, Reject, Game, Like, ChatMessage
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from sqlalchemy import select, or_, not_
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import generate_password_hash, check_password_hash

# Python 3.9 on macOS ships without scrypt in hashlib.
# Force pbkdf2:sha256 so hashing works on all platforms.
def hash_password(password: str) -> str:
    return generate_password_hash(password, method="pbkdf2:sha256")
from dotenv import load_dotenv
from flask_mail import Message
from api.mail.mailer import send_email

# Carga variables de entorno desde .env
load_dotenv()

# Obtén la clave de OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
else:
    import warnings
    warnings.warn("OPENAI_API_KEY is not set — the /chat endpoint will be disabled.", RuntimeWarning)

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route("/chat", methods=["POST"])
def chat():
    """
    Accepts JSON:
    - { "text": "...", "userInfo": "..." }        → single message
    - { "messages": [...], "userInfo": "..." }    → full conversation history
    Calls OpenAI and returns the generated reply.
    """
    if not OPENAI_API_KEY:
        return jsonify({"error": "AI service is not configured on this server."}), 503

    data = request.get_json()

    if not data or "userInfo" not in data or ("messages" not in data and "text" not in data):
        return jsonify({"error": "Missing required fields"}), 400
    user_info = data["userInfo"]

    # ✅ Si viene un único mensaje como texto:
    if "text" in data:
        history = [{"sender": "user", "text": data["text"]}]
    else:
        history = data["messages"]

    try:
        formatted_messages = [
            {
                "role": "system",
                "content": (
                    f"Eres un asistente virtual experto en videojuegos. "
                    f"Si te preguntan sobre otro tema, responde con educación que solo puedes hablar de videojuegos. "
                    f"Trabajas para PlayerLink, una app para encontrar compañeros de juego. "
                    f"La primera vez saludas con cercanía. "
                    f"Información del usuario: {user_info}"
                )
            }
        ]

        # Construir conversación para OpenAI
        for msg in history:
            role = "user" if msg.get("sender") == "user" else "assistant"
            content = msg.get("text", "")
            formatted_messages.append({"role": role, "content": content})

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=formatted_messages,
            temperature=0.7,
            max_tokens=512,
        )

        reply_text = response.choices[0].message.content.strip()
        return jsonify({"reply": reply_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api.route('/register', methods=['POST'])
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
def check_mail():
    try:
        data = request.json
        # buscamos el correo en la base de datos y almacenamos el resultado en la variable user
        user = db.session.execute(select(User).where(User.email == data['email'])).scalar_one_or_none()
        # si no se encuentra, se devuelve que el correo no se ha encontrado
        if not user:
            return jsonify({'success': False, 'msg': 'email not found'}), 404
        # creamos el token que se va a enviar y necesario para la recuperacion de la contraseña
        token = create_access_token(identity=str(user.id))
        if not token:
            return jsonify({'success': False, 'msg': 'token not found'}), 404

        result = send_email(data['email'], token)
        return jsonify({'success': True}), 200
    except Exception as e:
        return jsonify({'success': False, 'msg': 'something went wrong'})


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


# PRIVATE ENDPOINT
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
def post_profile(user_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing data'}), 400
    stmt = select(User).where(User.id == user_id)
    user = db.session.execute(stmt).scalar_one_or_none()
    if user is None:
        return jsonify({'error': f'can not find user with id: {user_id}'}), 400
    if user.profile:
        return jsonify({'error': 'this profile already exist, please try to modify it insted of create a new one'}), 400
    new_profile = Profile(
        gender=data.get('gender') or 'Undefinied',
        age=data.get('age') or 0,
        discord=data.get('discord') or 'Undefinied',
        name=data.get('name') or 'Undefinied',
        preferences=data.get('preferences') or 'Undefinied',
        zodiac=data.get('zodiac') or 'Undefinied',
        location=data.get('location') or 'Undefinied',
        nick_name=data.get('nick_name') or 'Undefinied',
        bio=data.get('bio') or 'Undefinied',
        language=data.get('language') or 'Undefinied',
        steam_id=data.get('steam_id') or 'Undefinied',
        photo=data.get('photo') or 'Undefinied'
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
        return jsonify({'error': f'can not find user with id: {user_id}'}), 400
    if not user.profile:
        return jsonify({'error': 'this profile do not  exist, please try to create it insted of modify one'}), 400

    user.profile.gender = data.get('gender', user.profile.gender)
    user.profile.preferences = data.get(
        'preferences', user.profile.preferences)
    user.profile.zodiac = data.get('zodiac', user.profile.zodiac)
    user.profile.discord = data.get('discord', user.profile.discord)
    user.profile.age = data.get('age', user.profile.age)
    user.profile.name = data.get('name', user.profile.name)
    user.profile.location = data.get('location', user.profile.location)
    user.profile.nick_name = data.get('nick_name', user.profile.nick_name)
    user.profile.bio = data.get('bio', user.profile.bio)
    user.profile.language = data.get('language', user.profile.language)
    user.profile.steam_id = data.get('steam_id', user.profile.steam_id)
    user.profile.photo = data.get('photo', user.profile.photo)

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
        return jsonify({'error': f'can not find user with id: {user_id}'}), 400
    if not user.profile:
        return jsonify({'error': 'this profile do not  exist, please try to create it insted of modify one'}), 400

    user.profile.photo = data.get('photo', user.profile.photo)

    db.session.commit()
    return jsonify(user.profile.serialize()), 200


# GET ALL REVIEWS
@api.route('/reviews', methods=['GET'])
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
        return jsonify({'error': f'review with id: {review_id} does not exist'})
    return jsonify(review.serialize()), 200


# GET REVIEWS AUTHORED
@api.route('/reviews_authored/<int:user_id>', methods=['GET'])
def get_reviews_authored(user_id):
    # 1. Buscamos al usuario; si no existe devolvemos 404
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 400

    # 2. Sacamos las reseñas que ha escrito
    reviews = user.reviews_authored

    # Serializamos cada review usando el método de instancia
    serialized = [rev.serialize() | {
        "stars": rev.stars,
        "comment": rev.comment
    } for rev in reviews]

    return jsonify({"reviews_authored": serialized}), 200


# GET USER REVIEWS
@api.route('/reviews_received/<int:user_id>', methods=['GET'])
def get_user_reviews(user_id):
    # 1. Buscamos al usuario; si no existe devolvemos 404
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 404

    # 2. Sacamos las reseñas que ha escrito
    reviews = user.reviews_received

    # Serializamos cada review usando el método de instancia
    serialized = [rev.serialize() | {
        "stars": rev.stars,
        "comment": rev.comment
    } for rev in reviews]

    return jsonify({"reviews_received": serialized}), 200


# DELETE REVIEW
@api.route('/reviews/<int:review_id>', methods=['DELETE'])
def delete_review(review_id):
    review = db.session.get(Review, review_id)
    if review is None:
        return jsonify({'error': 'that review does not exist'}), 400

    db.session.delete(review)
    db.session.commit()
    return jsonify({'message': 'review deleted'}), 200


# POST REVIEW
@api.route('/reviews/<int:author_id>/<int:receiver_id>', methods=['POST'])
def post_review(author_id, receiver_id):
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
def put_review(review_id):
    review = db.session.get(Review, review_id)
    if review is None:
        return jsonify({'error': 'that review does not exist'}), 400
    data = request.get_json()

    if 'stars' not in data or 'comment' not in data:
        return jsonify({'error': 'Faltan campos obligatorios'}), 400

    review.stars = data.get('stars', review.stars)
    review.comment = data.get('comment', review.comment)
    db.session.commit()
    return jsonify({'message': 'review updated'}), 200


# GET ALL MATCHES
@api.route('/matches', methods=['GET'])
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
def get_matches_for_user(user_id):
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
                "user_id":   u.id,
                "nickname":  u.profile.name if u.profile.name else "undefined",
                "games":     [g.serialize() for g in u.profile.games] if u.profile.games else [],
                "gender":    u.profile.gender if u.profile.gender else "undefined",
                "age": u.profile.age if u.profile.age else "undefined",
                "location": u.profile.location if u.profile.location else "undefined"
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


# POST A MATCH
@api.route('/matches/<int:user1_id>/<int:user2_id>', methods=['POST'])
def post_match(user1_id, user2_id):
    if user1_id == user2_id:
        return jsonify({'error': 'Cannot match yourself'}), 400
    user1 = db.session.get(User, user1_id)
    user2 = db.session.get(User, user2_id)
    if not user1 or not user2:
        return jsonify({'error': 'User not found'}), 404
    # prevent duplicates regardless of order
    existing = (db.session.query(Match)
                .filter(((Match.user1_id == user1_id) & (Match.user2_id == user2_id)) |
                ((Match.user1_id == user2_id) & (Match.user2_id == user1_id))).first())
    if existing:
        return jsonify({'error': 'Match already exists'}), 409
    new_match = Match(user1_id=user1_id, user2_id=user2_id)
    db.session.add(new_match)
    db.session.commit()
    return jsonify(new_match.serialize()), 201


# DELETE A MATCH
@api.route('/matches/<int:match_id>', methods=['DELETE'])
def delete_match(match_id):
    stmt = select(Match).where(Match.id == match_id)
    match = db.session.execute(stmt).scalar_one_or_none()
    if not match:
        return jsonify({'error': f'Match with id {match_id} not found'}), 404
    db.session.delete(match)
    db.session.commit()
    return jsonify({'message': f'Match {match_id} deleted'}), 200


# GET ALL REJECT
@api.route('/rejects', methods=['GET'])
def get_all_rejects():
    stmt = select(Reject)
    rejects = db.session.execute(stmt).scalars().all()
    return jsonify([reject.serialize() for reject in rejects]), 200


# GET REJECT BY ID
@api.route('/rejects/<reject_id>', methods=['GET'])
def get_single_reject(reject_id):
    stmt = select(Reject).where(Reject.id == reject_id)
    match = db.session.execute(stmt).scalar_one_or_none()
    if match is None:
        return jsonify({'error': f'match with id: {reject_id} not found'}), 400

    return jsonify(match.serialize())

# GET REJECTS SENT


@api.route('/rejects_sent/<user_id>', methods=['GET'])
def get_rejects_sent(user_id):
    # 1. Buscamos al usuario; si no existe devolvemos 404
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 400

    # 2. Sacamos las reseñas que ha escrito
    rejects = user.rejects_given

    # Serializamos cada review usando el método de instancia
    serialized = [reject.serialize() for reject in rejects]

    return jsonify({"rejects_authored": serialized}), 200

# GET REJECTS RECEIVED


@api.route('/rejects_received/<user_id>', methods=['GET'])
def get_rejects_received(user_id):
    # 1. Buscamos al usuario; si no existe devolvemos 404
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 400

    # 2. Sacamos las reseñas que ha escrito
    rejects = user.rejects_received

    # Serializamos cada review usando el método de instancia
    serialized = [reject.serialize() for reject in rejects]

    return jsonify({"rejects_received": serialized}), 200

# DELETE REJECT


@api.route('/rejects/<reject_id>', methods=['DELETE'])
def delete_reject(reject_id):
    stmt = select(Reject).where(Reject.id == reject_id)
    reject = db.session.execute(stmt).scalar_one_or_none()
    if reject is None:
        return jsonify({'error': f'reject with id: {reject_id} not found'})

    db.session.delete(reject)
    db.session.commit()
    return jsonify({'message': f'reject with id: {reject_id} deleted'})


# POST REJECT
@api.route('/rejects/<int:rejector_id>/<int:rejected_id>', methods=['POST'])
def post_reject(rejector_id, rejected_id):
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
def get_all_games():
    stmt = select(Game)
    games = db.session.execute(stmt).scalars().all()
    return jsonify([game.serialize() for game in games]), 200

# GET SINGLE GAMES


@api.route('/games/<int:game_id>', methods=['GET'])
def get_single_game(game_id):
    stmt = select(Game).where(Game.id == game_id)
    games = db.session.execute(stmt).scalar_one_or_none()
    if games is None:
        return jsonify({'error': 'this game does not exist'})
    return jsonify(games.serialize()), 200


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
def put_game_hours(game_id):
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No se están enviando los datos correctamente'}), 400

    # Buscar juego
    stmt = select(Game).where(Game.id == game_id)
    game = db.session.execute(stmt).scalar_one_or_none()

    if game is None:
        return jsonify({'error': 'Este juego no existe'}), 404

    # Actualizar los valores
    game.game_hoursPlayed = data.get("hours_played") or 'undefined'

    # Guardar cambios
    db.session.commit()

    return jsonify(game.serialize()), 200


# POST GAMES
@api.route('/games/<profile_id>', methods=['POST'])
def post_game(profile_id):
    # 1) Asegurarnos de que el Content-Type sea application/json
    if not request.is_json:
        return jsonify({'error': 'Se requiere Content-Type: application/json'}), 400

    data = request.get_json()

    # 2) Validar que venga la clave "game"
    if not data:
        return jsonify({'error': 'Falta el campo "game" en el JSON'}), 400

    # 4) Crear y persistir la nueva partida
    new_game = Game(
        profile_id=profile_id,
        game_hoursPlayed=data['hours_played'] or 'undefined',
        game_image=data['image'] or 'undefined',
        game_title=data['title'] or 'undefined'
    )
    db.session.add(new_game)
    db.session.commit()

    return jsonify(new_game.serialize()), 201


# DELETE GAME
@api.route('/games/<game_id>', methods=['DELETE'])
def delete_game(game_id):
    stmt = select(Game).where(Game.id == game_id)
    game = db.session.execute(stmt).scalar_one_or_none()
    if game is None:
        return jsonify({'error': f'game with id: {game_id} not found'}), 400

    db.session.delete(game)
    db.session.commit()
    return jsonify({'message': f'game with id: {game_id} deleted'}), 200


# GET ALL LIKES
@api.route('/likes', methods=['GET'])
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

# POST LIKE (ESTÁ LA LÓGICA PARA QUE SE CREE EL MATCH SI ES NECESARIO)


@api.route('/likes/<int:liker_id>/<int:liked_id>', methods=['POST'])
def post_like(liker_id, liked_id):
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
def delete_like(like_id):
    # Buscar el like
    like = db.session.get(Like, like_id)
    if not like:
        return jsonify({'error': f'Like with id {like_id} not found'}), 404

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

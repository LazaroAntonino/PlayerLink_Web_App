"""
Matches, Likes & Rejects blueprint.
Routes: /matches (CRUD), /likes (CRUD + auto-match), /rejects (CRUD)
"""
from flask import Blueprint, request, jsonify
from sqlalchemy import select, or_

from flask_jwt_extended import get_jwt_identity, jwt_required

from api.models import db, User, Match, Like, Reject
from api.utils import admin_required

matches_bp = Blueprint('matches', __name__)


# ── MATCHES CRUD ──────────────────────────────────────────────────────────────

@matches_bp.route('/matches', methods=['GET'])
@admin_required
def get_all_matches():
    matches = db.session.execute(select(Match)).scalars().all()
    return jsonify([match.serialize() for match in matches]), 200


@matches_bp.route('/matches/<int:match_id>', methods=['GET'])
def get_single_match(match_id):
    match = db.session.execute(
        select(Match).where(Match.id == match_id)
    ).scalar_one_or_none()
    if not match:
        return jsonify({'error': f'Match with id {match_id} not found'}), 404
    return jsonify(match.serialize()), 200


@matches_bp.route('/matches/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_matches_for_user(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    matches = db.session.execute(
        select(Match).where(
            or_(Match.user1_id == user_id, Match.user2_id == user_id)
        )
    ).scalars().all()

    other_users = []
    for m in matches:
        u = m.user2 if m.user1_id == user_id else m.user1
        if u.profile:
            other_users.append({
                "user_id":  u.id,
                "nickname": u.profile.nick_name or "undefined",
                "photo":    u.profile.photo    or "photo1",
                "games":    [g.serialize() for g in u.profile.games] if u.profile.games else [],
                "gender":   u.profile.gender   or "undefined",
                "age":      u.profile.age      or "undefined",
                "location": u.profile.location or "undefined",
            })
        else:
            other_users.append(f" user with id {u.id} has no data")

    # Deduplicate by user_id
    unique_dict = {}
    deduped = []
    for item in other_users:
        if isinstance(item, dict):
            uid = item["user_id"]
            if uid not in unique_dict:
                unique_dict[uid] = item
                deduped.append(item)
        else:
            deduped.append(item)

    return jsonify({"matches": deduped}), 200


@matches_bp.route('/matches/<int:match_id>', methods=['DELETE'])
@jwt_required()
def delete_match(match_id):
    match = db.session.execute(
        select(Match).where(Match.id == match_id)
    ).scalar_one_or_none()
    if not match:
        return jsonify({'error': f'Match with id {match_id} not found'}), 404
    requesting_id = int(get_jwt_identity())
    if match.user1_id != requesting_id and match.user2_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(match)
    db.session.commit()
    return jsonify({'message': f'Match {match_id} deleted'}), 200


# ── REJECTS CRUD ──────────────────────────────────────────────────────────────

@matches_bp.route('/rejects', methods=['GET'])
@admin_required
def get_all_rejects():
    rejects = db.session.execute(select(Reject)).scalars().all()
    return jsonify([reject.serialize() for reject in rejects]), 200


@matches_bp.route('/rejects/<int:reject_id>', methods=['GET'])
def get_single_reject(reject_id):
    reject = db.session.execute(
        select(Reject).where(Reject.id == reject_id)
    ).scalar_one_or_none()
    if reject is None:
        return jsonify({'error': f'reject with id: {reject_id} not found'}), 404
    return jsonify(reject.serialize()), 200


@matches_bp.route('/rejects_sent/<int:user_id>', methods=['GET'])
def get_rejects_sent(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 404
    return jsonify({"rejects_authored": [r.serialize() for r in user.rejects_given]}), 200


@matches_bp.route('/rejects_received/<int:user_id>', methods=['GET'])
def get_rejects_received(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': f'Usuario con id={user_id} no encontrado'}), 404
    return jsonify({"rejects_received": [r.serialize() for r in user.rejects_received]}), 200


@matches_bp.route('/rejects/<int:reject_id>', methods=['DELETE'])
@jwt_required()
def delete_reject(reject_id):
    reject = db.session.execute(
        select(Reject).where(Reject.id == reject_id)
    ).scalar_one_or_none()
    if reject is None:
        return jsonify({'error': f'reject with id: {reject_id} not found'}), 404
    requesting_id = int(get_jwt_identity())
    if reject.rejector_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(reject)
    db.session.commit()
    return jsonify({'message': f'reject with id: {reject_id} deleted'}), 200


@matches_bp.route('/rejects/<int:rejector_id>/<int:rejected_id>', methods=['POST'])
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

    existing = db.session.query(Reject).filter_by(
        rejector_id=rejector_id, rejected_id=rejected_id
    ).first()
    if existing:
        return jsonify({'error': 'Reject already exists'}), 409

    new_reject = Reject(rejector_id=rejector_id, rejected_id=rejected_id)
    db.session.add(new_reject)
    db.session.commit()
    return jsonify(new_reject.serialize()), 201


# ── LIKES CRUD + AUTO-MATCH ───────────────────────────────────────────────────

@matches_bp.route('/likes', methods=['GET'])
@admin_required
def get_all_likes():
    likes = db.session.execute(select(Like)).scalars().all()
    return jsonify([like.serialize() for like in likes]), 200


@matches_bp.route('/likes/<int:like_id>', methods=['GET'])
def get_single_like(like_id):
    like = db.session.execute(
        select(Like).where(Like.id == like_id)
    ).scalar_one_or_none()
    if not like:
        return jsonify({'error': f'Like with id {like_id} not found'}), 404
    return jsonify(like.serialize()), 200


@matches_bp.route('/likes/<int:liker_id>/<int:liked_id>', methods=['POST'])
@jwt_required()
def post_like(liker_id, liked_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != liker_id:
        return jsonify({'error': 'Unauthorized'}), 403
    if liker_id == liked_id:
        return jsonify({'error': 'Cannot like yourself'}), 400

    liker = db.session.get(User, liker_id)
    liked = db.session.get(User, liked_id)
    if not liker or not liked:
        return jsonify({'error': 'User not found'}), 404

    # Evitar likes duplicados
    existing_like = db.session.query(Like).filter_by(
        liker_id=liker_id, liked_id=liked_id
    ).first()
    if existing_like:
        return jsonify({'error': 'Like already exists'}), 409

    # Verificar like inverso para crear match automático
    reverse_like = db.session.query(Like).filter_by(
        liker_id=liked_id, liked_id=liker_id
    ).first()

    new_like = Like(liker_id=liker_id, liked_id=liked_id)
    db.session.add(new_like)

    match_created = None
    if reverse_like:
        existing_match = db.session.query(Match).filter(
            ((Match.user1_id == liker_id) & (Match.user2_id == liked_id)) |
            ((Match.user1_id == liked_id) & (Match.user2_id == liker_id))
        ).first()
        if not existing_match:
            new_match = Match(user1_id=liker_id, user2_id=liked_id)
            db.session.add(new_match)
            match_created = new_match

    db.session.commit()

    if match_created:
        other = liked
        match_profile = None
        if other.profile:
            match_profile = {
                "user_id":   other.id,
                "nick_name": other.profile.nick_name or other.profile.name or "undefined",
                "photo":     other.profile.photo     or "photo1",
                "name":      other.profile.name      or "undefined",
                "age":       other.profile.age,
                "location":  other.profile.location  or "undefined",
                "discord":   other.profile.discord   or "undefined",
                "games":     [g.serialize() for g in other.profile.games] if other.profile.games else [],
            }
        return jsonify({
            "is_match":     True,
            "match_id":     match_created.id,
            "match_profile": match_profile,
            "like":         new_like.serialize()
        }), 201

    return jsonify({"is_match": False, "like": new_like.serialize()}), 201


@matches_bp.route('/likes/<int:like_id>', methods=['DELETE'])
@jwt_required()
def delete_like(like_id):
    like = db.session.get(Like, like_id)
    if not like:
        return jsonify({'error': f'Like with id {like_id} not found'}), 404
    requesting_id = int(get_jwt_identity())
    if like.liker_id != requesting_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Si este like formó parte de un match, borrar el match también
    match = db.session.query(Match).filter(
        ((Match.user1_id == like.liker_id) & (Match.user2_id == like.liked_id)) |
        ((Match.user1_id == like.liked_id) & (Match.user2_id == like.liker_id))
    ).first()

    if match:
        db.session.delete(match)

    db.session.delete(like)
    db.session.commit()

    msg = f'Like {like_id} deleted, match removed' if match else f'Like {like_id} deleted'
    return jsonify({'message': msg}), 200

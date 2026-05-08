"""
Chat blueprint.
Routes: /chat/messages/<match_id> (GET/POST),
        /chat/messages/unread/count (GET),
        /chat/preview/<user_id> (GET)
"""
from flask import Blueprint, request, jsonify
from sqlalchemy import select

from flask_jwt_extended import get_jwt_identity, jwt_required

from api.models import db, Match, ChatMessage

chat_bp = Blueprint('chat', __name__)


# ── Helper ────────────────────────────────────────────────────────────────────
def _assert_match_member(match, user_id: int):
    """Returns (match, None) if ok, or (None, error_response) if unauthorized."""
    if match.user1_id != user_id and match.user2_id != user_id:
        return None, (jsonify({'error': 'Unauthorized: you are not part of this match'}), 403)
    return match, None


# ── GET messages ─────────────────────────────────────────────────────────────
@chat_bp.route('/chat/messages/<int:match_id>', methods=['GET'])
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


# ── POST message ──────────────────────────────────────────────────────────────
@chat_bp.route('/chat/messages/<int:match_id>', methods=['POST'])
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


# ── GET unread count ──────────────────────────────────────────────────────────
@chat_bp.route('/chat/messages/unread/count', methods=['GET'])
@jwt_required()
def get_unread_count():
    user_id = int(get_jwt_identity())

    match_ids = [
        m.id for m in db.session.query(Match.id).filter(
            (Match.user1_id == user_id) | (Match.user2_id == user_id)
        ).all()
    ]

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


# ── GET chat preview ──────────────────────────────────────────────────────────
@chat_bp.route('/chat/preview/<int:user_id>', methods=['GET'])
@jwt_required()
def get_chat_preview(user_id):
    requesting_id = int(get_jwt_identity())
    if requesting_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    matches = db.session.execute(
        select(Match).where(
            (Match.user1_id == user_id) | (Match.user2_id == user_id)
        )
    ).scalars().all()

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
            'photo':         other.profile.photo     if other.profile else None,
            'last_message':  last_msg.serialize()    if last_msg else None,
            'unread':        unread,
        })

    result.sort(
        key=lambda x: x['last_message']['created_at'] if x['last_message'] else '',
        reverse=True,
    )
    return jsonify(result), 200

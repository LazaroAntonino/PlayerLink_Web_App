"""
Chat blueprint.
Routes: /chat/messages/<match_id> (GET/POST),
        /chat/messages/unread/count (GET),
        /chat/preview/<user_id> (GET)

Pagination on GET /chat/messages/<match_id>:
  ?before_id=<int>  → load N messages older than that ID  (load-more)
  ?after_id=<int>   → load messages newer than that ID    (polling)
  ?limit=<int>      → page size, default 30, max 50
  Response: { messages: [...], has_more: bool, oldest_id: int|null }
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

    # ── Query params ──────────────────────────────────────────────────────
    before_id = request.args.get('before_id', type=int)   # load older history
    after_id  = request.args.get('after_id',  type=int)   # poll newer messages
    limit     = min(request.args.get('limit', 30, type=int), 50)

    q = db.session.query(ChatMessage).filter(ChatMessage.match_id == match_id)

    if after_id is not None:
        # Polling: all messages newer than after_id (no "has_more" needed here)
        messages = (
            q.filter(ChatMessage.id > after_id)
            .order_by(ChatMessage.created_at.asc())
            .all()
        )
        has_more = False

    elif before_id is not None:
        # Load older: messages with id < before_id, fetch limit+1 to detect more
        raw = (
            q.filter(ChatMessage.id < before_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit + 1)
            .all()
        )
        has_more = len(raw) > limit
        messages = list(reversed(raw[:limit]))

    else:
        # Initial load: last N messages
        raw = (
            q.order_by(ChatMessage.created_at.desc())
            .limit(limit + 1)
            .all()
        )
        has_more = len(raw) > limit
        messages = list(reversed(raw[:limit]))

    # ── Mark unread as read ───────────────────────────────────────────────
    # Always mark when viewing current/new messages (initial + polling).
    # Skip when loading older history (before_id) — those were already read.
    if before_id is None:
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

    oldest_id = messages[0].id if messages else None

    return jsonify({
        'messages':  [m.serialize() for m in messages],
        'has_more':  has_more,
        'oldest_id': oldest_id,
    }), 200


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

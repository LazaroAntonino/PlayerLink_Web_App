"""
Blocks & Reports blueprint.

Routes:
  POST   /api/block/<blocked_id>   → bloquear usuario
  DELETE /api/block/<blocked_id>   → desbloquear usuario
  GET    /api/blocks               → mis usuarios bloqueados
  POST   /api/report/<reported_id> → denunciar usuario

Lógica de bloqueo:
  - Al bloquear, se elimina automáticamente cualquier Match existente entre
    los dos usuarios (cascade en Match borra también sus ChatMessages).
  - El bloqueo es bidireccional en el explorador: ninguno de los dos
    aparece en los perfiles a explorar del otro.
"""
from flask import Blueprint, jsonify, request
from sqlalchemy import or_, and_, select

from flask_jwt_extended import get_jwt_identity, jwt_required

from api.models import db, User, Block, Match, Report

blocks_bp = Blueprint('blocks', __name__)


# ── Helper ────────────────────────────────────────────────────────────────────

def _delete_match_if_exists(user_a: int, user_b: int) -> None:
    """Elimina el Match entre user_a y user_b (en cualquier dirección)."""
    match = db.session.execute(
        select(Match).where(
            or_(
                and_(Match.user1_id == user_a, Match.user2_id == user_b),
                and_(Match.user1_id == user_b, Match.user2_id == user_a),
            )
        )
    ).scalar_one_or_none()
    if match:
        db.session.delete(match)


# ── POST /api/block/<blocked_id> ──────────────────────────────────────────────

@blocks_bp.route('/block/<int:blocked_id>', methods=['POST'])
@jwt_required()
def block_user(blocked_id):
    """Bloquea a un usuario y elimina el match existente si lo hay."""
    blocker_id = int(get_jwt_identity())

    if blocker_id == blocked_id:
        return jsonify({'error': 'No puedes bloquearte a ti mismo'}), 400

    blocked_user = db.session.get(User, blocked_id)
    if not blocked_user:
        return jsonify({'error': f'Usuario con id={blocked_id} no encontrado'}), 404

    existing = db.session.execute(
        select(Block).where(
            Block.blocker_id == blocker_id,
            Block.blocked_id == blocked_id,
        )
    ).scalar_one_or_none()
    if existing:
        return jsonify({'error': 'Ya has bloqueado a este usuario'}), 409

    # Crear bloqueo
    new_block = Block(blocker_id=blocker_id, blocked_id=blocked_id)
    db.session.add(new_block)

    # Eliminar match (y en cascada sus ChatMessages)
    _delete_match_if_exists(blocker_id, blocked_id)

    db.session.commit()

    return jsonify({
        'message':    'Usuario bloqueado correctamente',
        'blocked_id': blocked_id,
    }), 201


# ── DELETE /api/block/<blocked_id> ────────────────────────────────────────────

@blocks_bp.route('/block/<int:blocked_id>', methods=['DELETE'])
@jwt_required()
def unblock_user(blocked_id):
    """Desbloquea a un usuario previamente bloqueado."""
    blocker_id = int(get_jwt_identity())

    block = db.session.execute(
        select(Block).where(
            Block.blocker_id == blocker_id,
            Block.blocked_id == blocked_id,
        )
    ).scalar_one_or_none()
    if not block:
        return jsonify({'error': 'No has bloqueado a este usuario'}), 404

    db.session.delete(block)
    db.session.commit()

    return jsonify({'message': 'Usuario desbloqueado correctamente'}), 200


# ── GET /api/blocks ───────────────────────────────────────────────────────────

@blocks_bp.route('/blocks', methods=['GET'])
@jwt_required()
def get_my_blocks():
    """Devuelve la lista de IDs de usuarios bloqueados por el usuario autenticado."""
    user_id = int(get_jwt_identity())

    blocks = db.session.execute(
        select(Block).where(Block.blocker_id == user_id)
    ).scalars().all()

    return jsonify({
        'blocked_users': [b.serialize() for b in blocks],
    }), 200


# ── POST /api/report/<reported_id> ────────────────────────────────────────────

@blocks_bp.route('/report/<int:reported_id>', methods=['POST'])
@jwt_required()
def report_user(reported_id):
    """Envía una denuncia contra un usuario."""
    reporter_id = int(get_jwt_identity())

    if reporter_id == reported_id:
        return jsonify({'error': 'No puedes denunciarte a ti mismo'}), 400

    reported_user = db.session.get(User, reported_id)
    if not reported_user:
        return jsonify({'error': f'Usuario con id={reported_id} no encontrado'}), 404

    data = request.get_json() or {}
    reason = (data.get('reason') or '').strip()
    if not reason:
        return jsonify({'error': 'Debes indicar un motivo para la denuncia'}), 400
    if len(reason) > 500:
        return jsonify({'error': 'El motivo no puede superar los 500 caracteres'}), 400

    new_report = Report(
        reporter_id=reporter_id,
        reported_id=reported_id,
        reason=reason,
    )
    db.session.add(new_report)
    db.session.commit()

    return jsonify({'message': 'Denuncia enviada correctamente'}), 201

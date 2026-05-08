"""
AI (Game Advisor) blueprint.
Routes: /ai/find-games (POST)
Includes: Anthropic client, MCP tools definitions, tool executors,
          dispatch logic and system prompt.
"""
import os
import json

import anthropic as _anthropic_module
from flask import Blueprint, request, jsonify
from sqlalchemy import or_

from flask_jwt_extended import get_jwt_identity, jwt_required
from dotenv import load_dotenv

from api.models import db, User, Profile, Match, Game, ChatMessage

load_dotenv()

ai_bp = Blueprint('ai', __name__)

# ── Anthropic client (instanciado una vez al importar el módulo) ──────────────
_anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
anthropic_client = (
    _anthropic_module.Anthropic(api_key=_anthropic_api_key)
    if _anthropic_api_key else None
)


# ══════════════════════════════════════════════════════════════════════════════
# MCP TOOLS SCHEMA
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
        "input_schema": {"type": "object", "properties": {}}
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
        "input_schema": {"type": "object", "properties": {}}
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
        "input_schema": {"type": "object", "properties": {}}
    },
    {
        "name": "send_message_to_match",
        "description": (
            "Envía un mensaje de chat real en nombre del usuario a uno de sus matches. "
            "Úsala cuando el usuario pida que le escribas a un match. "
            "IMPORTANTE: Antes de enviar, usa get_user_matches para saber el match_id correcto. "
            "Siempre informa al usuario exactamente qué mensaje vas a enviar y a quién, "
            "y pide confirmación si hay ambigüedad."
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
                    "description": "Texto del mensaje a enviar (máximo 500 caracteres)."
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
            "CAMPOS: name, nick_name, bio, age, gender, zodiac, discord, steam_id, language, preferences, location, photo (photo1-photo9). "
            "FLUJO: 1) get_user_profile para ver campos vacíos, 2) preguntar datos que faltan, "
            "3) mostrar resumen y pedir confirmación, 4) ejecutar update_user_profile."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "name":        {"type": "string",  "description": "Nombre real del usuario"},
                "nick_name":   {"type": "string",  "description": "Nickname o gamertag (máx 21 caracteres)"},
                "age":         {"type": "integer", "description": "Edad del usuario"},
                "gender":      {"type": "string",  "description": "Género: 'Masculino', 'Femenino', 'No binario', 'Prefiero no decirlo'"},
                "location":    {"type": "string",  "description": "Ciudad y país, ej: 'Madrid, España'"},
                "zodiac":      {"type": "string",  "description": "Signo zodiacal, ej: 'Aries', 'Tauro'"},
                "discord":     {"type": "string",  "description": "Usuario de Discord, ej: 'nick#1234'"},
                "steam_id":    {"type": "string",  "description": "Steam Friend ID o URL de perfil de Steam"},
                "language":    {"type": "string",  "description": "Idiomas separados por coma, ej: 'Español, Inglés'"},
                "preferences": {"type": "string",  "description": "Estilo de juego, ej: 'Competitivo, Nocturno'"},
                "bio":         {"type": "string",  "description": "Descripción personal (máx 500 caracteres)"},
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
                "game_title":   {"type": "string",  "description": "Título exacto del juego"},
                "hours_played": {"type": "integer", "description": "Horas jugadas aproximadas"}
            },
            "required": ["game_title", "hours_played"]
        }
    }
]


# ══════════════════════════════════════════════════════════════════════════════
# GAMES CATALOG (usado por search y add_game)
# ══════════════════════════════════════════════════════════════════════════════

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


# ══════════════════════════════════════════════════════════════════════════════
# TOOL EXECUTORS
# ══════════════════════════════════════════════════════════════════════════════

def _execute_get_user_profile(user_id):
    try:
        user = db.session.get(User, user_id)
        if not user or not user.profile:
            return {"error": "Profile not found"}
        p = user.profile
        games_data = [
            {"title": g.game_title, "hours": g.game_hoursPlayed, "image": g.game_image}
            for g in (p.games or [])
        ]
        return {
            "nickname":    p.nick_name,
            "age":         p.age,
            "gender":      p.gender,
            "location":    p.location,
            "preferences": p.preferences,
            "bio":         p.bio,
            "language":    p.language,
            "discord":     p.discord,
            "games":       games_data,
            "total_games": len(games_data)
        }
    except Exception as e:
        return {"error": str(e)}


def _execute_search_games_catalog(query, limit=5):
    try:
        q = query.lower()
        results = []
        for game in _GAMES_CATALOG:
            score = 0
            if q in game["title"].lower():   score += 3
            if q in game["genre"].lower():   score += 2
            if q in game["platform"].lower(): score += 1
            if score > 0:
                results.append({**game, "relevance": score})
        if not results:
            results = [dict(g) for g in _GAMES_CATALOG[:limit]]
        else:
            results.sort(key=lambda x: x["relevance"], reverse=True)
        return {"query": query, "results": results[:limit], "total_found": len(results)}
    except Exception as e:
        return {"error": str(e)}


def _execute_get_compatible_players(user_id, limit=3):
    try:
        current_user = db.session.get(User, user_id)
        if not current_user or not current_user.profile:
            return {"error": "User profile not found"}
        current_games = {g.game_title for g in (current_user.profile.games or []) if g.game_title}
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
                    "nickname":       profile.nick_name,
                    "games_in_common": list(games_in_common),
                    "common_count":   len(games_in_common),
                    "location":       profile.location  or "Desconocida",
                    "preferences":    profile.preferences or "No especificadas"
                })
        compatible.sort(key=lambda x: x["common_count"], reverse=True)
        return {
            "compatible_players": compatible[:limit],
            "total_found":        len(compatible),
            "your_games":         list(current_games)
        }
    except Exception as e:
        return {"error": str(e)}


def _execute_get_game_community_stats(game_title):
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
        avg_hours   = total_hours / len(games) if games else 0
        top_players = sorted(games, key=lambda g: g.game_hoursPlayed or 0, reverse=True)[:3]
        return {
            "game":               game_title,
            "players_count":      len(games),
            "total_hours_played": total_hours,
            "average_hours":      round(avg_hours, 1),
            "top_players": [
                {"nickname": g.profile.nick_name if g.profile else "Desconocido", "hours": g.game_hoursPlayed}
                for g in top_players
            ]
        }
    except Exception as e:
        return {"error": str(e)}


def _execute_get_user_matches(user_id):
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
                    "match_id":        match.id,
                    "nickname":        other_user.profile.nick_name or "Sin nick",
                    "games_in_common": list(my_games & other_games),
                    "location":        other_user.profile.location or "Desconocida",
                    "matched_at":      match.created_at.isoformat() if match.created_at else None
                })
        return {"total_matches": len(matches_data), "matches": matches_data}
    except Exception as e:
        return {"error": str(e)}


def _execute_update_user_profile(user_id, fields: dict):
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
            if key not in ALLOWED or value is None:
                continue
            if key == "nick_name" and len(str(value)) > 21:
                return {"error": f"El nick_name no puede superar 21 caracteres"}
            if key == "bio" and len(str(value)) > 500:
                return {"error": "La bio no puede superar 500 caracteres"}
            if key == "age" and (not isinstance(value, int) or value < 10 or value > 99):
                return {"error": "La edad debe ser un número entre 10 y 99"}
            if key == "photo" and str(value) not in [f"photo{i}" for i in range(1, 10)]:
                return {"error": "Foto inválida. Usa photo1-photo9"}
            setattr(p, key, value)
            updated[key] = value
        if not updated:
            return {"error": "No se proporcionaron campos válidos para actualizar"}
        db.session.commit()
        return {
            "success":         True,
            "updated_fields":  updated,
            "profile_updated": True,
            "message":         f"Perfil actualizado. Campos: {', '.join(updated.keys())}"
        }
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}


def _execute_add_game_to_profile(user_id, game_title: str, hours_played: int):
    try:
        user = db.session.get(User, user_id)
        if not user or not user.profile:
            return {"error": "Perfil no encontrado"}
        profile_id = user.profile.id
        existing = db.session.query(Game).filter(
            Game.profile_id == profile_id,
            Game.game_title.ilike(game_title)
        ).first()
        if existing:
            return {
                "error": f"'{game_title}' ya está en tu perfil ({existing.game_hoursPlayed} horas). "
                         "Usa la app para editar las horas si quieres actualizarlas."
            }
        game_image = "default.jpg"
        for entry in _GAMES_CATALOG:
            if entry.get("title", "").lower() == game_title.lower():
                game_image = entry.get("image", "default.jpg")
                break
        new_game = Game(
            profile_id=profile_id,
            game_title=game_title,
            game_hoursPlayed=hours_played,
            game_image=game_image
        )
        db.session.add(new_game)
        db.session.commit()
        return {
            "success":         True,
            "game_added":      game_title,
            "hours":           hours_played,
            "profile_updated": True,
            "message":         f"'{game_title}' añadido con {hours_played} horas."
        }
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}


def _execute_send_message_to_match(match_id, message, user_id):
    try:
        if not message or not message.strip():
            return {"error": "El mensaje no puede estar vacío"}
        if len(message) > 500:
            return {"error": "El mensaje supera los 500 caracteres"}
        match = db.session.get(Match, match_id)
        if not match:
            return {"error": f"Match {match_id} no encontrado"}
        if match.user1_id != user_id and match.user2_id != user_id:
            return {"error": "No tienes acceso a este match"}
        other_id = match.user2_id if match.user1_id == user_id else match.user1_id
        other_user = db.session.get(User, other_id)
        other_nick = other_user.profile.nick_name if other_user and other_user.profile else f"usuario {other_id}"
        msg = ChatMessage(match_id=match_id, sender_id=user_id, content=message.strip())
        db.session.add(msg)
        db.session.commit()
        return {
            "success":      True,
            "message_sent": message.strip(),
            "sent_to":      other_nick,
            "match_id":     match_id,
            "message_id":   msg.id
        }
    except Exception as e:
        return {"error": str(e)}


def _execute_get_platform_stats():
    try:
        from api.models import User as _User, Profile as _Profile, Match as _Match
        total_users    = db.session.query(_User).count()
        total_profiles = db.session.query(_Profile).count()
        total_matches  = db.session.query(_Match).count()
        top_games_query = db.session.query(
            Game.game_title,
            db.func.count(Game.id).label("players")
        ).group_by(Game.game_title).order_by(db.func.count(Game.id).desc()).limit(5).all()
        return {
            "total_users":    total_users,
            "total_profiles": total_profiles,
            "total_matches":  total_matches,
            "top_games": [{"title": g.game_title, "players": g.players} for g in top_games_query]
        }
    except Exception as e:
        return {"error": str(e)}


# ── Tool dispatcher ───────────────────────────────────────────────────────────

def _dispatch_tool(tool_name, tool_input, user_id):
    dispatchers = {
        "get_user_profile":         lambda: _execute_get_user_profile(user_id),
        "search_games_catalog":     lambda: _execute_search_games_catalog(
            tool_input.get("query", ""), tool_input.get("limit", 5)
        ),
        "get_compatible_players":   lambda: _execute_get_compatible_players(
            user_id, tool_input.get("limit", 3)
        ),
        "get_game_community_stats": lambda: _execute_get_game_community_stats(
            tool_input.get("game_title", "")
        ),
        "get_user_matches":         lambda: _execute_get_user_matches(user_id),
        "get_platform_stats":       lambda: _execute_get_platform_stats(),
        "send_message_to_match":    lambda: _execute_send_message_to_match(
            tool_input.get("match_id"), tool_input.get("message", ""), user_id
        ),
        "update_user_profile":      lambda: _execute_update_user_profile(
            user_id, {k: v for k, v in tool_input.items()}
        ),
        "add_game_to_profile":      lambda: _execute_add_game_to_profile(
            user_id, tool_input.get("game_title", ""), tool_input.get("hours_played", 0)
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
- get_user_profile: perfil completo, juegos y preferencias del usuario
- search_games_catalog: buscar juegos por género o características
- get_compatible_players: jugadores compatibles por juegos en común
- get_game_community_stats: estadísticas de un juego en PlayerLink
- get_user_matches: matches actuales del usuario
- get_platform_stats: estadísticas globales de la plataforma
- send_message_to_match: envía un mensaje real de chat a un match
- update_user_profile: actualiza campos del perfil
- add_game_to_profile: añade un juego con horas jugadas al perfil

REGLAS IMPORTANTES:
- Usa las tools SIEMPRE que el usuario pregunte sobre sus datos o quiera recomendaciones personalizadas
- Nunca inventes datos de la BD — usa las tools para obtener información real
- Responde en el mismo idioma que el usuario
- Si una tool devuelve error, informa amablemente al usuario
- Para enviar mensajes: primero usa get_user_matches para obtener el match_id correcto
- Para actualizar perfil: SIEMPRE muestra resumen y pide confirmación antes de ejecutar
- Para COMPLETAR PERFIL: 1) get_user_profile, 2) preguntar datos faltantes, 3) confirmar, 4) guardar"""


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

@ai_bp.route('/ai/find-games', methods=['POST'])
@jwt_required()
def ai_find_games():
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

        system_prompt = _AI_SYSTEM_PROMPT_TEMPLATE.format(user_id=current_user_id)

        # Frontend: [{sender: "user"|"bot", text: "..."}]
        # Claude:   [{role: "user"|"assistant", content: "..."}]
        claude_messages = []
        for msg in messages_from_client:
            text   = msg.get('text', '').strip()
            sender = msg.get('sender', '')
            if sender == 'bot' and ('Game Advisor' in text or 'PlayerLink AI' in text):
                continue
            role = 'user' if sender == 'user' else 'assistant'
            if text:
                claude_messages.append({"role": role, "content": text})

        if not claude_messages:
            return jsonify({"error": "No valid messages to process"}), 400

        # Garantizar alternancia estricta user/assistant
        filtered = []
        for msg in claude_messages:
            if filtered and filtered[-1]['role'] == msg['role']:
                filtered[-1] = msg
            else:
                filtered.append(msg)
        claude_messages = filtered

        if claude_messages[-1]['role'] != 'user':
            return jsonify({"error": "Invalid message sequence — last message must be from user"}), 400

        # ── Agentic loop ──────────────────────────────────────────────────────
        max_iterations    = 5
        iteration         = 0
        profile_was_updated = False

        while iteration < max_iterations:
            iteration += 1

            response = anthropic_client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=1024,
                system=system_prompt,
                tools=AI_TOOLS,
                messages=claude_messages
            )

            if response.stop_reason == "end_turn":
                final_text = "".join(
                    block.text for block in response.content
                    if hasattr(block, 'text')
                )
                return jsonify({
                    "reply":           final_text.strip(),
                    "profile_updated": profile_was_updated
                }), 200

            if response.stop_reason == "tool_use":
                claude_messages.append({"role": "assistant", "content": response.content})
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        result = _dispatch_tool(block.name, block.input, current_user_id)
                        if isinstance(result, dict) and result.get("profile_updated"):
                            profile_was_updated = True
                        tool_results.append({
                            "type":        "tool_result",
                            "tool_use_id": block.id,
                            "content":     json.dumps(result, ensure_ascii=False, default=str)
                        })
                if tool_results:
                    claude_messages.append({"role": "user", "content": tool_results})
                continue

            break  # stop_reason inesperado

        return jsonify({
            "reply":           "Lo siento, no pude completar la respuesta. Por favor, inténtalo de nuevo.",
            "profile_updated": profile_was_updated
        }), 200

    except _anthropic_module.APIConnectionError:
        return jsonify({"error": "No se pudo conectar con el servicio de IA. Comprueba tu conexión."}), 503
    except _anthropic_module.RateLimitError:
        return jsonify({"error": "Demasiadas peticiones al servicio de IA. Espera un momento."}), 429
    except _anthropic_module.APIStatusError as e:
        print(f"[AI] Anthropic API error: {e.status_code} — {e.message}")
        return jsonify({"error": f"Anthropic API error {e.status_code}", "detail": str(e.message)}), 500
    except Exception as e:
        import traceback
        print(f"[AI] Unexpected error in /api/ai/find-games: {e}")
        traceback.print_exc()
        return jsonify({"error": "Error interno del servidor", "detail": str(e)}), 500

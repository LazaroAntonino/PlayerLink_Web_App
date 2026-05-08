"""
routes.py — DEPRECATED

All routes have been refactored into individual blueprint modules:
  - api/auth.py      → /register, /login, /token, /check_mail, /password_*, /private, /users
  - api/profiles.py  → /profiles, /games, /reviews
  - api/matches.py   → /matches, /likes, /rejects
  - api/chat.py      → /chat/messages, /chat/preview
  - api/ai.py        → /ai/find-games

This file is intentionally empty and kept only for reference.
"""

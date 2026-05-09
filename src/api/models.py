from __future__ import annotations
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, ForeignKey, Integer, JSON, DateTime, func, text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(String(250), nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, server_default='false')

    # Relaciones
    profile: Mapped[Optional[Profile]] = relationship(
        'Profile', back_populates='user', uselist=False,
        cascade='all, delete-orphan', single_parent=True
    )
    # Reseñas que le hacen a este usuario
    reviews_received: Mapped[List[Review]] = relationship(
        'Review', back_populates='user',
        foreign_keys='Review.user_id',
        cascade='all, delete-orphan'
    )
    # Reseñas que este usuario escribe
    reviews_authored: Mapped[List[Review]] = relationship(
        'Review', back_populates='author',
        foreign_keys='Review.author_id',
        cascade='all, delete-orphan'
    )
    # Likes que hace este usuario
    likes_given: Mapped[List[Like]] = relationship(
        'Like', foreign_keys='Like.liker_id', back_populates='liker',
        cascade='all, delete-orphan'
    )
    # Likes que este usuario recibe
    likes_received: Mapped[List[Like]] = relationship(
        'Like', foreign_keys='Like.liked_id', back_populates='liked',
        cascade='all, delete-orphan'
    )

    # Matches de este usuario
    matches_initiated: Mapped[List[Match]] = relationship(
        'Match', foreign_keys='Match.user1_id', back_populates='user1',
        cascade='all, delete-orphan'
    )
    matches_received: Mapped[List[Match]] = relationship(
        'Match', foreign_keys='Match.user2_id', back_populates='user2',
        cascade='all, delete-orphan'
    )

    rejects_given: Mapped[List[Reject]] = relationship(
        'Reject', foreign_keys='Reject.rejector_id',
        back_populates='rejector', cascade='all, delete-orphan'
    )
    rejects_received: Mapped[List[Reject]] = relationship(
        'Reject', foreign_keys='Reject.rejected_id',
        back_populates='rejected', cascade='all, delete-orphan'
    )

    # Bloqueos
    blocks_given: Mapped[List['Block']] = relationship(
        'Block', foreign_keys='Block.blocker_id',
        back_populates='blocker', cascade='all, delete-orphan'
    )
    blocks_received: Mapped[List['Block']] = relationship(
        'Block', foreign_keys='Block.blocked_id',
        back_populates='blocked', cascade='all, delete-orphan'
    )

    # Denuncias
    reports_given: Mapped[List['Report']] = relationship(
        'Report', foreign_keys='Report.reporter_id',
        back_populates='reporter', cascade='all, delete-orphan'
    )
    reports_received: Mapped[List['Report']] = relationship(
        'Report', foreign_keys='Report.reported_id',
        back_populates='reported', cascade='all, delete-orphan'
    )

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "is_admin": self.is_admin,
            "email_verified": self.email_verified,
            # No serializar password por seguridad
            "profile": self.profile.serialize() if self.profile else None
        }


class Profile(db.Model):
    __tablename__ = 'profiles'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), unique=True)
    gender: Mapped[str] = mapped_column(String(30), nullable=True)
    age: Mapped[int] = mapped_column(Integer, nullable=True)
    name: Mapped[str] = mapped_column(String(40), nullable=True)
    discord: Mapped[str] = mapped_column(
        String(40), nullable=True)
    preferences: Mapped[str] = mapped_column(String(200), nullable=True)
    zodiac: Mapped[str] = mapped_column(String(20), nullable=True)
    location: Mapped[str] = mapped_column(String(50), nullable=True)
    nick_name: Mapped[str] = mapped_column(
        String(21), nullable=True)
    bio: Mapped[str] = mapped_column(String(500),nullable=True)
    photo: Mapped[str] = mapped_column(String(500), nullable=True)
    language: Mapped[str] = mapped_column(String(100), nullable=True)
    steam_id: Mapped[str] = mapped_column(
        String(200),nullable=True)

    # Relaciones
    user: Mapped[User] = relationship('User', back_populates='profile')
    games: Mapped[List[Game]] = relationship(
        'Game', back_populates='profile', cascade='all, delete-orphan')

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "gender": self.gender,
            'preferences': self.preferences,
            'zodiac': self.zodiac,
            'location': self.location,
            "nick_name": self.nick_name,
            "bio": self.bio,
            "language": self.language,
            "photo": self.photo,
            "name":self.name,
            "games": [g.serialize() for g in self.games] if self.games else [],
            "age": self.age,
            "discord": self.discord,
            "steam": self.steam_id
        }


class Review(db.Model):
    __tablename__ = 'reviews'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    author_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    stars: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(String(100), nullable=True)

    # Relaciones
    user: Mapped[User] = relationship(
        'User', back_populates='reviews_received', foreign_keys=[user_id])
    author: Mapped[User] = relationship(
        'User', back_populates='reviews_authored', foreign_keys=[author_id])

    def serialize(self):
        return {
            "id": self.id,
            'user_id': self.user_id,
            'user_nickname': self.user.profile.nick_name if self.user.profile and self.user.profile.nick_name else "undefined",
            'author_id': self.author_id,
            'author_nickname': self.author.profile.nick_name if self.author.profile and self.author.profile.nick_name else "undefined",
            "stars": self.stars,
            "comment": self.comment
        }


class Game(db.Model):
    __tablename__ = 'games'
    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey(
        'profiles.id', ondelete='CASCADE'), nullable=False)
    game_title: Mapped[str] = mapped_column(nullable=True)
    game_image: Mapped[str] = mapped_column(nullable=True)
    game_hoursPlayed: Mapped[int]=mapped_column(nullable=True)

    # Relaciones
    profile: Mapped[Profile] = relationship('Profile', back_populates='games')

    def serialize(self):
        return {
            "id": self.id,
            "profile_id": self.profile_id,
            "gameTitle": self.game_title,
            "gameImage": self.game_image,
            "gameHoursPlayed":self.game_hoursPlayed
        }


class Like(db.Model):
    __tablename__ = 'likes'
    id: Mapped[int] = mapped_column(primary_key=True)
    liker_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    liked_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relaciones
    liker: Mapped[User] = relationship(
        'User', foreign_keys=[liker_id], back_populates='likes_given')
    liked: Mapped[User] = relationship(
        'User', foreign_keys=[liked_id], back_populates='likes_received')

    def serialize(self):
        return {
            "id": self.id,
            "liker_id": self.liker_id,
            "liked_id": self.liked_id
        }


class Match(db.Model):
    __tablename__ = 'matches'
    id: Mapped[int] = mapped_column(primary_key=True)
    user1_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    user2_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relaciones
    user1: Mapped[User] = relationship(
        'User', foreign_keys=[user1_id], back_populates='matches_initiated')
    user2: Mapped[User] = relationship(
        'User', foreign_keys=[user2_id], back_populates='matches_received')
    messages: Mapped[List['ChatMessage']] = relationship(
        'ChatMessage', back_populates='match', cascade='all, delete-orphan',
        order_by='ChatMessage.created_at'
    )

    def serialize(self):
        return {
            "match_id": self.id,
            "user1": {
                "user_id": self.user1_id,
                "user_data": {
                    "nickname": self.user1.profile.nick_name if self.user1.profile and self.user1.profile.nick_name else "undefined",
                    "name": self.user1.profile.name if self.user1.profile and self.user1.profile.name else "undefined",
                    "games": [g.serialize() for g in self.user1.profile.games] if self.user1.profile and self.user1.profile.games else [],
                    "gender": self.user1.profile.gender if self.user1.profile and self.user1.profile.gender else "undefined",
                    "age": self.user1.profile.age if self.user1.profile and self.user1.profile.age else "undefined",
                } if self.user1.profile else "user has no data"
            },
            "user2": {
                "user_id": self.user2_id,
                "user_data": {
                    "nickname": self.user2.profile.nick_name if self.user2.profile and self.user2.profile.nick_name else "undefined",
                    "name": self.user2.profile.name if self.user2.profile and self.user2.profile.name else "undefined",
                    "games": [g.serialize() for g in self.user2.profile.games] if self.user2.profile and self.user2.profile.games else [],
                    "gender": self.user2.profile.gender if self.user2.profile and self.user2.profile.gender else "undefined",
                    "age": self.user2.profile.age if self.user2.profile and self.user2.profile.age else "undefined",
                } if self.user2.profile else "user has no data"
            }
        }


class Reject(db.Model):
    __tablename__ = 'rejects'
    id: Mapped[int] = mapped_column(primary_key=True)
    rejector_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    rejected_id: Mapped[int] = mapped_column(ForeignKey(
        'users.id', ondelete='CASCADE'), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relaciones
    rejector: Mapped[User] = relationship(
        'User', foreign_keys=[rejector_id], back_populates='rejects_given')
    rejected: Mapped[User] = relationship(
        'User', foreign_keys=[rejected_id], back_populates='rejects_received')

    def serialize(self):
        return {
            "id": self.id,
            "rejector_id": self.rejector_id,
            "rejected_id": self.rejected_id
        }


# ── Chat messages ────────────────────────────────────────────────────────────
# NOTE: Class is named ChatMessage (not Message) to avoid collision with
#       flask_mail.Message which is imported in routes.py.

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    id: Mapped[int] = mapped_column(primary_key=True)
    match_id: Mapped[int] = mapped_column(
        ForeignKey('matches.id', ondelete='CASCADE'), nullable=False)
    sender_id: Mapped[int] = mapped_column(
        ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relaciones
    match: Mapped['Match'] = relationship('Match', back_populates='messages')
    sender: Mapped[User] = relationship('User', foreign_keys=[sender_id])

    def serialize(self):
        return {
            'id':         self.id,
            'match_id':   self.match_id,
            'sender_id':  self.sender_id,
            'content':    self.content,
            'created_at': self.created_at.isoformat(),
            'read':       self.read,
        }


class PasswordResetToken(db.Model):
    __tablename__ = 'password_reset_tokens'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)


class EmailVerificationToken(db.Model):
    """One-time token sent to the user's email to confirm their address."""
    __tablename__ = 'email_verification_tokens'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token_hash: Mapped[str] = mapped_column(
        String(128), nullable=False, unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False)


# ── Block ────────────────────────────────────────────────────────────────────

class Block(db.Model):
    """Registro de bloqueo entre dos usuarios.

    Cuando A bloquea a B:
      - B desaparece del explorador de A (y viceversa).
      - El match existente entre A y B se elimina en el endpoint de bloqueo.
      - Un mismo par (blocker, blocked) solo puede existir una vez (UniqueConstraint).
    """
    __tablename__ = 'blocks'
    __table_args__ = (UniqueConstraint('blocker_id', 'blocked_id', name='uq_block_pair'),)

    id: Mapped[int] = mapped_column(primary_key=True)
    blocker_id: Mapped[int] = mapped_column(
        ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    blocked_id: Mapped[int] = mapped_column(
        ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relaciones
    blocker: Mapped['User'] = relationship(
        'User', foreign_keys=[blocker_id], back_populates='blocks_given')
    blocked: Mapped['User'] = relationship(
        'User', foreign_keys=[blocked_id], back_populates='blocks_received')

    def serialize(self):
        return {
            'id':         self.id,
            'blocker_id': self.blocker_id,
            'blocked_id': self.blocked_id,
            'created_at': self.created_at.isoformat(),
        }


# ── Report ───────────────────────────────────────────────────────────────────

class Report(db.Model):
    """Denuncia de un usuario contra otro.

    El campo `resolved` es gestionado por administradores desde Flask-Admin.
    Se permiten múltiples denuncias del mismo reporter sobre el mismo reported
    para que los moderadores tengan un historial completo.
    """
    __tablename__ = 'reports'

    id: Mapped[int] = mapped_column(primary_key=True)
    reporter_id: Mapped[int] = mapped_column(
        ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    reported_id: Mapped[int] = mapped_column(
        ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    resolved: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, server_default='false')

    # Relaciones
    reporter: Mapped['User'] = relationship(
        'User', foreign_keys=[reporter_id], back_populates='reports_given')
    reported: Mapped['User'] = relationship(
        'User', foreign_keys=[reported_id], back_populates='reports_received')

    def serialize(self):
        return {
            'id':          self.id,
            'reporter_id': self.reporter_id,
            'reported_id': self.reported_id,
            'reason':      self.reason,
            'created_at':  self.created_at.isoformat(),
            'resolved':    self.resolved,
        }

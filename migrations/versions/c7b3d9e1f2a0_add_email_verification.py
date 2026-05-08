"""add email verification

Adds:
  - users.email_verified  (Boolean, NOT NULL)
    * All EXISTING users are backfilled to TRUE (already trusted).
    * New users default to FALSE until they click the verification link.
  - email_verification_tokens table (mirrors password_reset_tokens pattern)

Revision ID: c7b3d9e1f2a0
Revises: 437134e9d128
Create Date: 2026-05-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7b3d9e1f2a0'
down_revision = '437134e9d128'
branch_labels = None
depends_on = None


def upgrade():
    # ── Step 1: add nullable column so we can backfill before NOT NULL ──────
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('email_verified', sa.Boolean(), nullable=True)
        )

    # ── Step 2: backfill — all existing users are already verified ───────────
    op.execute("UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL")

    # ── Step 3: enforce NOT NULL + set server_default=false for new rows ─────
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column(
            'email_verified',
            nullable=False,
            server_default=sa.false(),
        )

    # ── Step 4: create email_verification_tokens table ───────────────────────
    op.create_table(
        'email_verification_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('token_hash', sa.String(length=128), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    with op.batch_alter_table('email_verification_tokens', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_email_verification_tokens_token_hash'),
            ['token_hash'],
            unique=True,
        )


def downgrade():
    with op.batch_alter_table('email_verification_tokens', schema=None) as batch_op:
        batch_op.drop_index(
            batch_op.f('ix_email_verification_tokens_token_hash')
        )
    op.drop_table('email_verification_tokens')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('email_verified')

"""widen profile.photo column from 20 to 500 chars for Cloudinary URLs

Revision ID: d1a2b3c4d5e6
Revises: c7b3d9e1f2a0
Create Date: 2026-05-08
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd1a2b3c4d5e6'
down_revision = 'c7b3d9e1f2a0'
branch_labels = None
depends_on = None


def upgrade():
    # SQLite does not support ALTER COLUMN directly — batch mode handles this.
    # Existing values ("photo1"…"photo9") are short and will be unaffected.
    with op.batch_alter_table('profiles', schema=None) as batch_op:
        batch_op.alter_column(
            'photo',
            existing_type=sa.String(length=20),
            type_=sa.String(length=500),
            existing_nullable=True,
        )


def downgrade():
    # NOTE: any Cloudinary URLs stored in 'photo' will be truncated to 20 chars
    # on downgrade — this is intentional and expected when rolling back.
    with op.batch_alter_table('profiles', schema=None) as batch_op:
        batch_op.alter_column(
            'photo',
            existing_type=sa.String(length=500),
            type_=sa.String(length=20),
            existing_nullable=True,
        )

"""rename movement to transaction group

Revision ID: 57e76c5fb22f
Revises: 6865511ba6b5
Create Date: 2024-03-01 19:46:01.347367

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "57e76c5fb22f"
down_revision: Union[str, None] = "6865511ba6b5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.rename_table("movement", "transaction_group")
    op.alter_column(
        "transaction", "movement_id", new_column_name="transaction_group_id"
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column(
        "transaction", "transaction_group_id", new_column_name="movement_id"
    )
    op.rename_table("transaction_group", "movement")
    # ### end Alembic commands ###
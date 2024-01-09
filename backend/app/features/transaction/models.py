# Copyright (C) 2024 Alexandre Amat
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from typing import TYPE_CHECKING
from decimal import Decimal
from datetime import date

from sqlmodel import Field, Relationship, SQLModel, asc, desc, col, or_, and_, func
from sqlmodel.sql.expression import SelectOfScalar
from sqlalchemy.sql.expression import ClauseElement

from app.common.models import Base, CurrencyCode, SyncedMixin, SyncableBase, SyncedBase
from app.common.utils import filter_query_by_search

from app.features.file import File, FileApiOut

if TYPE_CHECKING:
    from app.features.institution import Institution
    from app.features.user import User
    from app.features.userinstitutionlink import UserInstitutionLink
    from app.features.account import Account
    from app.features.movement import Movement


class __TransactionBase(SQLModel):
    amount: Decimal
    timestamp: date
    name: str


class TransactionApiOut(__TransactionBase, Base):
    account_balance: Decimal
    account_id: int
    movement_id: int
    files: list[FileApiOut]
    is_synced: bool


class TransactionApiIn(__TransactionBase):
    ...


class TransactionPlaidIn(TransactionApiIn, SyncedMixin):
    ...


class TransactionPlaidOut(TransactionApiOut, SyncedBase):
    ...


class Transaction(__TransactionBase, SyncableBase, table=True):
    account_id: int = Field(foreign_key="account.id")
    movement_id: int = Field(foreign_key="movement.id")
    account_balance: Decimal
    files: list[File] = Relationship(
        back_populates="transaction",
        sa_relationship_kwargs={"cascade": "all, delete"},
    )

    account: "Account" = Relationship(back_populates="transactions")
    movement: "Movement" = Relationship(back_populates="transactions")

    @property
    def currency_code(self) -> CurrencyCode:
        return self.account.currency_code

    @property
    def user(self) -> "User":
        return self.account.user

    @property
    def institution(self) -> "Institution | None":
        return self.account.institution

    @property
    def userinstitutionlink(self) -> "UserInstitutionLink | None":
        return self.account.userinstitutionlink

    @property
    def is_synced(self) -> bool:
        return self.plaid_id != None

    @classmethod
    def get_timestamp_desc_clauses(cls) -> tuple[ClauseElement, ClauseElement]:
        return desc(cls.timestamp), desc(cls.id)

    @classmethod
    def get_timestamp_asc_clauses(cls) -> tuple[ClauseElement, ClauseElement]:
        return asc(cls.timestamp), asc(cls.id)

    @classmethod
    def select_transactions(
        cls,
        transaction_id: int | None,
        page: int = 0,
        per_page: int = 0,
        search: str | None = None,
        timestamp_ge: date | None = None,
        timestamp_le: date | None = None,
        is_descending: bool = True,
        amount_ge: Decimal | None = None,
        amount_le: Decimal | None = None,
        is_amount_abs: bool = False,
    ) -> SelectOfScalar["Transaction"]:
        # SELECT
        statement = Transaction.select()

        # WHERE
        if transaction_id is not None:
            statement = statement.where(Transaction.id == transaction_id)
        if timestamp_ge:
            # where_op = "__le__" if is_descending else "__ge__"  # choose >= or <=
            statement = statement.where(Transaction.timestamp >= timestamp_ge)
        if timestamp_le:
            statement = statement.where(Transaction.timestamp <= timestamp_le)
        if search:
            statement = filter_query_by_search(search, statement, col(Transaction.name))

        if amount_ge:
            if is_amount_abs:
                statement = statement.where(func.abs(Transaction.amount) >= amount_ge)
            else:
                statement = statement.where(col(Transaction.amount) >= amount_ge)
        if amount_le:
            if is_amount_abs:
                statement = statement.where(func.abs(Transaction.amount) <= amount_le)
            else:
                statement = statement.where(Transaction.amount <= amount_le)

        # ORDER BY
        statement = statement.order_by(
            *(
                cls.get_timestamp_desc_clauses()
                if is_descending
                else cls.get_timestamp_asc_clauses()
            )
        )

        # OFFSET and LIMIT
        if per_page:
            offset = page * per_page
            statement = statement.offset(offset).limit(per_page)

        return statement

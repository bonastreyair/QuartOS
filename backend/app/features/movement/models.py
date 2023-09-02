import requests
import re
from enum import Enum
from decimal import Decimal
from datetime import date
from typing import Iterable, Any

from sqlmodel import SQLModel, Relationship, and_, or_, col, func
from sqlmodel.sql.expression import SelectOfScalar

from app.common.models import Base, CurrencyCode
from app.common.utils import filter_query_by_search
from app.features.exchangerate.client import get_exchange_rate
from app.features.transaction import Transaction, TransactionApiOut


class PLStatement(SQLModel):
    start_date: date
    end_date: date
    income: Decimal
    expenses: Decimal
    currency_code: CurrencyCode


class __MovementBase(SQLModel):
    name: str


class MovementField(str, Enum):
    TIMESTAMP = "timestamp"
    AMOUNT = "amount"


class MovementApiOut(__MovementBase, Base):
    earliest_timestamp: date | None
    latest_timestamp: date | None
    transactions: list[TransactionApiOut]
    amounts: dict[CurrencyCode, Decimal]
    amount: Decimal


class MovementApiIn(__MovementBase):
    ...


class Movement(__MovementBase, Base, table=True):
    transactions: list[Transaction] = Relationship(
        back_populates="movement",
        sa_relationship_kwargs={"cascade": "all, delete"},
    )

    @property
    def earliest_timestamp(self) -> date:
        return min(t.timestamp for t in self.transactions)

    @property
    def latest_timestamp(self) -> date:
        return max(t.timestamp for t in self.transactions)

    def get_amount(self, currency_code: CurrencyCode) -> Decimal:
        try:
            return sum(
                [
                    t.amount
                    * get_exchange_rate(t.currency_code, currency_code, t.timestamp)
                    for t in self.transactions
                ],
                Decimal(0),
            )
        except requests.exceptions.ConnectionError:
            return Decimal("NaN")

    @property
    def currencies(self) -> set[CurrencyCode]:
        return {t.currency_code for t in self.transactions}

    @property
    def amounts(self) -> dict[CurrencyCode, Decimal]:
        return {c: self.get_amount(c) for c in self.currencies}

    @classmethod
    def select_transactions(
        cls, movement_id: int | None, transaction_id: int | None, **kwargs: Any
    ) -> SelectOfScalar[Transaction]:
        statement = Transaction.select_transactions(transaction_id, **kwargs)

        statement = statement.join(cls)
        if movement_id:
            statement = statement.where(cls.id == movement_id)

        return statement

    @classmethod
    def select_movements(
        cls,
        movement_id: int | None,
        page: int = 0,
        per_page: int | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        search: str | None = None,
        is_descending: bool = True,
        sort_by: MovementField = MovementField.TIMESTAMP,
    ) -> SelectOfScalar["Movement"]:
        # SELECT
        statement = cls.select()

        # WHERE
        if movement_id:
            statement = statement.where(cls.id == movement_id)
        if start_date:
            statement = statement.having(func.min(Transaction.timestamp) >= start_date)
        if end_date:
            statement = statement.having(func.min(Transaction.timestamp) < end_date)
        if search:
            statement = filter_query_by_search(search, statement, col(Transaction.name))

        # GROUP BY
        statement = statement.group_by(Movement.id)

        # ORDER BY
        if sort_by is MovementField.TIMESTAMP:
            if is_descending:
                order_clauses = Transaction.get_timestamp_desc_clauses()
            else:
                order_clauses = Transaction.get_timestamp_asc_clauses()
            statement = statement.order_by(*order_clauses)

        # LIMIT OFFSET
        if per_page:
            offset = page * per_page
            statement = statement.offset(offset).limit(per_page)

        return statement

    @classmethod
    def filter_movements(
        cls,
        movements: Iterable["Movement"],
        amount_gt: Decimal | None,
        amount_lt: Decimal | None,
        is_descending: bool,
        sort_by: MovementField,
        currency_code: CurrencyCode,
    ) -> Iterable["Movement"]:
        if amount_gt is not None:
            movements = [
                m for m in movements if m.get_amount(currency_code) > amount_gt
            ]

        if amount_lt is not None:
            movements = [
                m for m in movements if m.get_amount(currency_code) < amount_lt
            ]

        if sort_by is MovementField.AMOUNT:
            movements = sorted(
                movements,
                key=lambda m: m.get_amount(currency_code),
                reverse=is_descending,
            )

        return movements

    @classmethod
    def get_aggregate(
        cls,
        movements: Iterable["Movement"],
        start_date: date,
        end_date: date,
        currency_code: CurrencyCode,
    ) -> PLStatement:
        income_total = Decimal(0)
        expense_total = Decimal(0)

        for movement in movements:
            amount = movement.get_amount(currency_code)
            if amount >= Decimal(0):
                income_total += amount
            else:
                expense_total += amount

        return PLStatement(
            start_date=start_date,
            end_date=end_date,
            income=income_total,
            expenses=expense_total,
            currency_code=currency_code,
        )

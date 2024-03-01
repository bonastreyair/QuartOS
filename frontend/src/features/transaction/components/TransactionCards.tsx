// Copyright (C) 2024 Alexandre Amat
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import {
  TransactionGroupApiOut,
  ReadManyUsersMeTransactionsGetApiArg,
  TransactionApiOut,
  api,
} from "app/services/api";
import { Checkboxes } from "hooks/useCheckboxes";
import { MutableRefObject } from "react";
import { Card } from "semantic-ui-react";
import { PaginatedItemProps } from "types";
import { formatDateParam } from "utils/time";
import { InfiniteScroll } from "../../../components/InfiniteScroll";
import { TransactionsBarState } from "./Bar";
import { TransactionCard } from "./TransactionCard";

export default function TransactionCards(props: {
  barState: TransactionsBarState;
  isMultipleChoice?: boolean;
  transactionCheckboxes: Checkboxes;
  transactionGroupCheckboxes: Checkboxes;
  accountId?: number;
  reference: MutableRefObject<HTMLDivElement | null>;
}) {
  const [search] = props.barState.search;
  const [timestampGe] = props.barState.timestampGe;
  const [timestampLe] = props.barState.timestampLe;
  const [isDescending] = props.barState.isDescending;
  const [amountGe] = props.barState.amountGe;
  const [amountLe] = props.barState.amountLe;
  const [isAmountAbs] = props.barState.isAmountAbs;
  const [consolidated] = props.barState.consolidated;

  let amountKey = "amount";
  if (consolidated) amountKey = `${amountKey}DefaultCurrency`;
  let amountGeKey = `${amountKey}Ge`;
  let amountLeKey = `${amountKey}Le`;
  if (isAmountAbs) {
    amountGeKey = `${amountGeKey}Abs`;
    amountLeKey = `${amountLeKey}Abs`;
  }

  const params: ReadManyUsersMeTransactionsGetApiArg = {
    timestampGe: timestampGe && formatDateParam(timestampGe),
    timestampLe: timestampLe && formatDateParam(timestampLe),
    search,
    [amountGeKey]: amountGe,
    [amountLeKey]: amountLe,
    accountIdEq: props.accountId,
    consolidated,
    orderBy: isDescending ? "timestamp__desc" : "timestamp__asc",
  };

  const CardRenderer = ({
    response: t,
    loading,
  }: PaginatedItemProps<TransactionApiOut | TransactionGroupApiOut>) =>
    t?.consolidated ? (
      <TransactionCard.Group
        transaction={t}
        checked={t && props.transactionGroupCheckboxes.checked.has(t.id)}
        checkBoxDisabled={
          t && props.transactionGroupCheckboxes.disabled.has(t.id)
        }
        onCheckedChange={
          props.isMultipleChoice && t
            ? (x) => props.transactionGroupCheckboxes.onChange(t.id, x)
            : undefined
        }
        loading={loading}
      />
    ) : (
      <TransactionCard.Simple
        transaction={t}
        checked={t && props.transactionCheckboxes.checked.has(t.id)}
        checkBoxDisabled={t && props.transactionCheckboxes.disabled.has(t.id)}
        onCheckedChange={
          props.isMultipleChoice && t
            ? (x) => props.transactionCheckboxes.onChange(t.id, x)
            : undefined
        }
        loading={loading}
        currency={consolidated ? "default" : "account"}
      />
    );

  return (
    <Card.Group style={{ margin: 1, overflow: "hidden" }}>
      <InfiniteScroll
        reference={props.reference}
        endpoint={api.endpoints.readManyUsersMeTransactionsGet}
        params={params}
        itemRenderer={CardRenderer}
      />
    </Card.Group>
  );
}

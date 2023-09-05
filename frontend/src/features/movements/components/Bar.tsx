import { Button, Menu } from "semantic-ui-react";
import MenuDateRange from "components/MenuDateInput";
import MenuInputSearch from "components/MenuInputSearch";
import MenuDropdownAccount from "components/MenuDropdownAccount";
import { UseStateType } from "types";
import MenuNumericRange from "components/MenuNumericRange";

export function Bar(props: {
  onOpenCreateForm: () => void;
  searchState: UseStateType<string | undefined>;
  startDateState: UseStateType<Date | undefined>;
  endDateState: UseStateType<Date | undefined>;
  accountIdState: UseStateType<number | undefined>;
  transactionsGeState: UseStateType<number | undefined>;
  transactionsLeState: UseStateType<number | undefined>;
  isDescendingState: UseStateType<boolean>;
  amountGeState: UseStateType<number | undefined>;
  amountLeState: UseStateType<number | undefined>;
  isAmountAbsState: UseStateType<boolean>;
}) {
  return (
    <Menu secondary>
      <Menu.Item fitted>
        <Button icon="plus" circular primary onClick={props.onOpenCreateForm} />
      </Menu.Item>
      <MenuInputSearch searchState={props.searchState} />
      <MenuDropdownAccount accountIdState={props.accountIdState} />
      <MenuDateRange
        dateGeState={props.startDateState}
        dateLeState={props.endDateState}
        isDescendingState={props.isDescendingState}
      />
      <MenuNumericRange
        icon="exchange"
        valueGeState={props.transactionsGeState}
        valueLeState={props.transactionsLeState}
      />
      <MenuNumericRange
        icon="dollar"
        valueGeState={props.amountGeState}
        valueLeState={props.amountLeState}
        isAbsState={props.isAmountAbsState}
        decimal
        signed
      />
    </Menu>
  );
}

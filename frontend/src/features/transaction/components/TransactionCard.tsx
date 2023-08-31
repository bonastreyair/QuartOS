import { TransactionApiIn, TransactionApiOut } from "app/services/api";
import {
  Button,
  Card,
  Checkbox,
  CheckboxProps,
  Grid,
  Header,
  Placeholder,
  Popup,
} from "semantic-ui-react";
import LoadableQuery from "components/LoadableCell";
import { useAccountQueries } from "features/account/hooks";
import CurrencyLabel from "components/CurrencyLabel";
import FormattedTimestamp from "components/FormattedTimestamp";
import ActionButton from "components/ActionButton";
import AccountIcon from "features/account/components/Icon";
import { FormattedCurrency } from "components/FormattedCurrency";
import LineWithHiddenOverflow from "components/LineWithHiddenOverflow";
import MutateActionButton from "components/MutateActionButton";

export function TransactionCard(
  props:
    | {
        transaction: TransactionApiOut;
      }
    | {
        // from transactions or movement with 1 transaction
        transaction: TransactionApiOut;
        onGoMovement: () => void;
        onOpenEditForm: () => void;
        explanationRate?: number;
      }
    | {
        // from movement form
        transaction: TransactionApiOut;
        onOpenEditForm: () => void;
        onCheckboxChange: (x: boolean) => Promise<void>;
        checkBoxDisabled: boolean;
        checked: boolean;
      }
    | {
        // from preview
        transaction: TransactionApiIn;
        accountId: number;
      }
) {
  const accountQueries = useAccountQueries(
    "accountId" in props ? props.accountId : props.transaction.account_id
  );

  const currencyLabel = (
    <div>
      Total:
      {accountQueries.account ? (
        <CurrencyLabel
          amount={props.transaction.amount}
          currencyCode={accountQueries.account.currency_code}
        />
      ) : (
        <CurrencyLabel.Placeholder />
      )}
    </div>
  );

  return (
    <Card fluid color="teal">
      <Card.Content>
        <Grid columns="equal" verticalAlign="middle">
          <Grid.Column width={2}>
            <Card.Meta>
              <FormattedTimestamp timestamp={props.transaction.timestamp} />
            </Card.Meta>
          </Grid.Column>
          <Grid.Column width={3}>
            <LoadableQuery query={accountQueries}>
              <AccountIcon
                account={accountQueries.account!}
                institution={accountQueries.institution}
              />
              {accountQueries.account?.name}
            </LoadableQuery>
          </Grid.Column>
          <Grid.Column>
            <Header as="h5">
              <LineWithHiddenOverflow content={props.transaction.name} />
            </Header>
          </Grid.Column>
          {"onCheckboxChange" in props && (
            <Grid.Column width={1} textAlign="center" verticalAlign="middle">
              <Popup
                content={
                  props.checked
                    ? "Remove from the movement"
                    : "Add to the movement"
                }
                trigger={
                  <Checkbox
                    disabled={props.checkBoxDisabled}
                    checked={props.checked}
                    onChange={async (_: unknown, data: CheckboxProps) =>
                      await props.onCheckboxChange!(data.checked || false)
                    }
                  />
                }
              />
            </Grid.Column>
          )}
          {"onGoMovement" in props && (
            <Grid.Column width={1} textAlign="center">
              <ActionButton
                tooltip="Edit Movement"
                icon="arrows alternate horizontal"
                onClick={props.onGoMovement!}
              />
            </Grid.Column>
          )}
          {"onOpenEditForm" in props && (
            <Grid.Column width={1} textAlign="center">
              <MutateActionButton onOpenEditForm={props.onOpenEditForm} />
            </Grid.Column>
          )}
        </Grid>
      </Card.Content>
      <Card.Content extra>
        {"explanationRate" in props && props.explanationRate && (
          <Header sub floated="left">
            {props.explanationRate.toFixed(0)}%
          </Header>
        )}
        <Header as="h5" floated="right">
          {"account_balance" in props.transaction ? (
            <Popup
              position="left center"
              content={
                <p>
                  Account balance:
                  {accountQueries.account && (
                    <FormattedCurrency
                      amount={props.transaction.account_balance || 0}
                      currencyCode={accountQueries.account.currency_code}
                    />
                  )}
                </p>
              }
              trigger={currencyLabel}
            />
          ) : (
            currencyLabel
          )}
        </Header>
      </Card.Content>
    </Card>
  );
}

function CardPlaceholder(props: {
  onGoMovement?: boolean;
  explanationRate?: boolean;
  onOpenEditForm?: boolean;
  onCheckboxChange?: boolean;
  checkBoxDisabled?: boolean;
  checked?: boolean;
}) {
  return (
    <Card fluid color="teal">
      <Card.Content>
        <Grid columns="equal" verticalAlign="middle">
          <Grid.Column width={2}>
            <Placeholder fluid>
              <Placeholder.Header>
                <Placeholder.Line />
              </Placeholder.Header>
            </Placeholder>
          </Grid.Column>
          <Grid.Column width={3}>
            <Placeholder fluid>
              <Placeholder.Header image>
                <Placeholder.Line />
              </Placeholder.Header>
            </Placeholder>
          </Grid.Column>
          <Grid.Column>
            <Placeholder fluid>
              <Placeholder.Header>
                <Placeholder.Line />
              </Placeholder.Header>
            </Placeholder>
          </Grid.Column>
          <Grid.Column width={1} textAlign="center">
            <Button
              circular
              basic
              icon="ellipsis horizontal"
              size="tiny"
              loading
            />
          </Grid.Column>
        </Grid>
      </Card.Content>
      <Card.Content extra>
        <Header as="h5" floated="right">
          <div>
            Total:
            <CurrencyLabel.Placeholder />
          </div>
        </Header>
      </Card.Content>
    </Card>
  );
}

TransactionCard.Placeholder = CardPlaceholder;

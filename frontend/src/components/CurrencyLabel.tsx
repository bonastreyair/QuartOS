import { Label } from "semantic-ui-react";

export default function CurrencyLabel(props: {
  amount: number;
  currencyCode: string;
}) {
  return (
    <Label
      style={{ width: 100, textAlign: "center" }}
      color={props.amount > 0 ? "green" : "orange"}
    >
      {props.amount.toLocaleString(undefined, {
        style: "currency",
        currency: props.currencyCode,
      })}
    </Label>
  );
}
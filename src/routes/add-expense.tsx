import { createFileRoute } from "@tanstack/react-router";
import { AddExpense } from "../pages/AddExpense";

export const Route = createFileRoute("/add-expense")({
  component: AddExpense,
});

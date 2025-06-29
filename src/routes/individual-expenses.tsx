import { createFileRoute } from "@tanstack/react-router";
import { IndividualExpensesPage } from "../pages/IndividualExpensesPage";

export const Route = createFileRoute("/individual-expenses")({
  component: IndividualExpensesPage,
});

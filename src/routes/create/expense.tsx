import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/create/expense")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/create/expense"!</div>;
}

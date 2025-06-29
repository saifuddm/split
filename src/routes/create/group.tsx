import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/create/group")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/create/group"!</div>;
}

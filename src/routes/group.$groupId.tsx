import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/group/$groupId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { groupId } = Route.useParams();
  return <div>Hello {groupId}!</div>;
}

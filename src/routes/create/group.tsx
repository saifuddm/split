import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/create/group")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/create/group"!</div>;
}

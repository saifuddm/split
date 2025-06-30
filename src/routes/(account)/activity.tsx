import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(account)/activity")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: () => <div>Hello "/(account)/activity"!</div>,
});

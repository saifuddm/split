import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/create/expense")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: () => <div>Hello "/create/expense"!</div>,
});

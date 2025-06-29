import { createFileRoute } from "@tanstack/react-router";
import { ActivityFeed } from "../pages/ActivityFeed";

export const Route = createFileRoute("/activity")({
  component: ActivityFeed,
});

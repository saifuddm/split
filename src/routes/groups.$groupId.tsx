import { createFileRoute } from "@tanstack/react-router";
import { GroupDetail } from "../pages/GroupDetail";

export const Route = createFileRoute("/groups/$groupId")({
  component: GroupDetail,
});

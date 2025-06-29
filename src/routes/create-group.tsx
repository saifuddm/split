import { createFileRoute } from "@tanstack/react-router";
import { CreateGroup } from "../pages/CreateGroup";

export const Route = createFileRoute("/create-group")({
  component: CreateGroup,
});

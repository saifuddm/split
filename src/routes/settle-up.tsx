import { createFileRoute } from "@tanstack/react-router";
import { SettleUp } from "../pages/SettleUp";

export const Route = createFileRoute("/settle-up")({
  component: SettleUp,
});

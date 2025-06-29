import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LandingPage } from "../pages/LandingPage";
import { useAppStore } from "../data/useAppStore";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { hasEnteredApp } = useAppStore();

  // If user has entered the app, redirect to dashboard
  if (hasEnteredApp) {
    return <Navigate to="/dashboard" />;
  }

  return <LandingPage />;
}

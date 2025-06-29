import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { useStore } from "../data/store";

export const Route = createRootRoute({
  component: () => {
    const { initializeDarkMode } = useStore();

    // Initialize dark mode based on system preference
    useEffect(() => {
      initializeDarkMode();
    }, [initializeDarkMode]);

    return (
      <div className="bg-base text-text min-h-screen">
        <Outlet />
        <TanStackRouterDevtools />
      </div>
    );
  },
});

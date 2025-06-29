import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useStore } from "../data/store";

export const Route = createRootRoute({
  beforeLoad: () => {
    // Initialize dark mode based on system preference
    const { initializeDarkMode } = useStore.getState();
    initializeDarkMode();
  },
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
  notFoundComponent: () => <div>Not Found</div>,
});

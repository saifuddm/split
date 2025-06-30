import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useStore } from "../data/store";
import type { AuthStore } from "../data/useAuthStore";

export interface RouterContext {
  auth: AuthStore;
}

export const Route = createRootRouteWithContext<RouterContext>()({
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

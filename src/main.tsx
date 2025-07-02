import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { useAuthStore } from "./data/useAuthStore";
import { useStore } from "./data/store";
import "./index.css";

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const authStore = useAuthStore();
  const { initializeDarkMode } = useStore();

  useEffect(() => {
    authStore.actions.initialize();
    // Initialize dark mode after a short delay to ensure the store is hydrated
    setTimeout(() => {
      initializeDarkMode();
    }, 0);
  }, [initializeDarkMode]);

  return <RouterProvider router={router} context={{ auth: authStore }} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

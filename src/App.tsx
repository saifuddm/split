import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useStore } from "./data/store";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { LandingPage } from "./pages/LandingPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainAppLayout } from "./components/MainAppLayout";

function App() {
  const { initializeDarkMode } = useStore();

  // Initialize dark mode based on system preference
  useEffect(() => {
    initializeDarkMode();
  }, [initializeDarkMode]);

  return (
    <div className="min-h-screen bg-base text-text">
      <Routes>
        {/* Public Routes */}
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
        {/* Protected Application Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainAppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
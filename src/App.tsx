import { useEffect } from "react";
import { useStore } from "./data/store";
import { useAppStore } from "./data/useAppStore";
import { Dashboard } from "./pages/Dashboard";
import { GroupDetail } from "./pages/GroupDetail";
import { AddExpense } from "./pages/AddExpense";
import { CreateGroup } from "./pages/CreateGroup";
import { SettleUp } from "./pages/SettleUp";
import { LandingPage } from "./pages/LandingPage";

function App() {
  const { isDark, toggleDarkMode, initializeDarkMode } = useStore();
  const { currentPage, hasEnteredApp } = useAppStore();

  // Initialize dark mode based on system preference
  useEffect(() => {
    initializeDarkMode();
  }, [initializeDarkMode]);

  // If user hasn't entered the app yet, show landing page
  if (!hasEnteredApp) {
    return <LandingPage />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'group-details':
        return <GroupDetail />;
      case 'add-expense':
        return <AddExpense />;
      case 'create-group':
        return <CreateGroup />;
      case 'settle-up':
        return <SettleUp />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-base text-text">
      {renderCurrentPage()}
      
      {/* Dark mode toggle - positioned in top right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleDarkMode}
          className="bg-mantle border border-surface0 rounded-lg p-2 hover:bg-surface0 transition-colors"
        >
          {isDark ? (
            <span className="text-yellow">☀️</span>
          ) : (
            <span className="text-blue">🌙</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default App;
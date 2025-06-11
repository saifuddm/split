import React, { useEffect } from "react";
import { useStore } from "./data/store";
import { useAppStore } from "./data/useAppStore";
import { Dashboard } from "./pages/Dashboard";
import { GroupDetail } from "./pages/GroupDetail";
import { AddExpense } from "./pages/AddExpense";

function App() {
  const { isDark, toggleDarkMode, initializeDarkMode } = useStore();
  const { currentPage } = useAppStore();

  // Initialize dark mode based on system preference
  useEffect(() => {
    initializeDarkMode();
  }, [initializeDarkMode]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'group-details':
        return <GroupDetail />;
      case 'add-expense':
        return <AddExpense />;
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
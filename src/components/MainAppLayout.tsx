import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAppStore } from '../data/useAppStore';
import { useAuth } from '../context/AuthContext';
import { Dashboard } from '../pages/Dashboard';
import { GroupDetail } from '../pages/GroupDetail';
import { AddExpense } from '../pages/AddExpense';
import { CreateGroup } from '../pages/CreateGroup';
import { SettleUp } from '../pages/SettleUp';
import { Settings } from '../pages/Settings';
import { ActivityFeed } from '../pages/ActivityFeed';
import { IndividualExpensesPage } from '../pages/IndividualExpensesPage';

export const MainAppLayout: React.FC = () => {
  const { user } = useAuth();
  const { isLoading, actions } = useAppStore();

  // Load initial data when the user is authenticated
  useEffect(() => {
    if (user) {
      actions.loadInitialData();
    }
  }, [user, actions]);

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-base text-text flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-subtext1">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base text-text">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/group/:groupId" element={<GroupDetail />} />
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/add-expense/:groupId" element={<AddExpense />} />
        <Route path="/create-group" element={<CreateGroup />} />
        <Route path="/settle-up" element={<SettleUp />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/activity" element={<ActivityFeed />} />
        <Route path="/individual-expenses" element={<IndividualExpensesPage />} />
      </Routes>
    </div>
  );
};
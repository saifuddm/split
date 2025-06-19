import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { GroupDetail } from '../pages/GroupDetail';
import { AddExpense } from '../pages/AddExpense';
import { CreateGroup } from '../pages/CreateGroup';
import { SettleUp } from '../pages/SettleUp';
import { Settings } from '../pages/Settings';
import { ActivityFeed } from '../pages/ActivityFeed';
import { IndividualExpensesPage } from '../pages/IndividualExpensesPage';

export const MainAppLayout: React.FC = () => {
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
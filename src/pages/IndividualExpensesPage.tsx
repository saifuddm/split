import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ExpenseCard } from '../components/ExpenseCard';

export const IndividualExpensesPage: React.FC = () => {
  const { currentUser, expenses, actions } = useAppStore();
  
  // Get all non-group transactions, sorted by date (newest first)
  const individualTransactions = expenses
    .filter(exp => !exp.groupId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return (
    <div className="min-h-screen bg-base text-text">
      {/* Header */}
      <div className="bg-mantle border-b border-surface0 p-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => actions.navigateTo('dashboard')}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Individual Expenses</h1>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4">
        {/* All Transactions Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">All Transactions</h2>
          <div className="space-y-3">
            {individualTransactions.length === 0 ? (
              <Card>
                <p className="text-center text-subtext1">No individual transactions yet</p>
              </Card>
            ) : (
              individualTransactions.map(expense => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
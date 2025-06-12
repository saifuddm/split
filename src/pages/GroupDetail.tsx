import React from 'react';
import { ArrowLeft, Plus, Handshake } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { calculateSimplifiedDebts } from '../lib/utils';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { ExpenseCard } from '../components/ExpenseCard';

export const GroupDetail: React.FC = () => {
  const { activeGroupId, currentUser, groups, expenses, actions } = useAppStore();
  
  const group = groups.find(g => g.id === activeGroupId);
  const groupExpenses = expenses.filter(exp => exp.groupId === activeGroupId);
  
  if (!group) {
    return (
      <div className="min-h-screen bg-base text-text p-4">
        <div className="max-w-md mx-auto">
          <p>Group not found</p>
          <Button onClick={() => actions.navigateTo('dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  const simplifiedDebts = calculateSimplifiedDebts(group.members, groupExpenses);
  
  return (
    <div className="min-h-screen bg-base text-text">
      {/* Header */}
      <div className="bg-mantle border-b border-surface0 p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => actions.navigateTo('dashboard')}
              className="p-2"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold">{group.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => actions.navigateTo('settle-up')}
              className="p-2"
            >
              <Handshake size={20} />
            </Button>
            <Button
              size="sm"
              onClick={() => actions.navigateTo('add-expense', activeGroupId || undefined)}
              className="p-2"
            >
              <Plus size={20} />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4">
        {/* Simplified Debts Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Who Owes Who</h2>
          <div className="space-y-3">
            {simplifiedDebts.length === 0 ? (
              <Card>
                <p className="text-center text-subtext1">Everyone is settled up!</p>
              </Card>
            ) : (
              simplifiedDebts.map(({ debtor, creditor, amount }, index) => (
                <Card key={index}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar user={debtor} />
                      <span className="font-medium">
                        {debtor.id === currentUser.id ? "You" : debtor.name}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-subtext1">owes</span>
                      <span className="font-semibold text-red">
                        ${amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar user={creditor} />
                      <span className="font-medium">
                        {creditor.id === currentUser.id ? "You" : creditor.name}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
        
        {/* Expenses Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Expenses</h2>
          <div className="space-y-3">
            {groupExpenses.length === 0 ? (
              <Card>
                <p className="text-center text-subtext1">No expenses yet</p>
              </Card>
            ) : (
              groupExpenses.map(expense => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
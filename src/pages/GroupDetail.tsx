import React, { useState } from 'react';
import { ArrowLeft, Plus, ChevronDown } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { currentUser } from '../lib/mockdata';
import { calculateSimplifiedDebts } from '../lib/utils';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';

export const GroupDetail: React.FC = () => {
  const { activeGroupId, groups, expenses, actions } = useAppStore();
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  
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
  
  const handleToggleExpense = (expenseId: string) => {
    setExpandedExpenseId(prevId => (prevId === expenseId ? null : expenseId));
  };
  
  const simplifiedDebts = calculateSimplifiedDebts(group.members, groupExpenses);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
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
          <Button
            size="sm"
            onClick={() => actions.navigateTo('add-expense', activeGroupId)}
            className="p-2"
          >
            <Plus size={20} />
          </Button>
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
              groupExpenses.map(expense => {
                // Find current user's participation in this expense
                const currentUserParticipant = expense.participants.find(
                  p => p.user.id === currentUser.id
                );
                
                return (
                  <Card key={expense.id} className="p-0">
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => handleToggleExpense(expense.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{expense.description}</h3>
                          <div className="flex items-center gap-2 text-sm text-subtext1">
                            <Avatar user={expense.paidBy} size="sm" />
                            <span>
                              {expense.paidBy.id === currentUser.id ? 'You' : expense.paidBy.name} paid
                            </span>
                          </div>
                          <p className="text-xs text-subtext0 mt-1">
                            {formatDate(expense.date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${expense.amount.toFixed(2)}</p>
                          {currentUserParticipant ? (
                            <p className="text-xs text-subtext1">
                              Your share: ${currentUserParticipant.share.toFixed(2)}
                            </p>
                          ) : (
                            <p className="text-xs text-subtext1">
                              Not involved in split
                            </p>
                          )}
                        </div>
                        <ChevronDown
                          size={20}
                          className={`ml-2 text-subtext1 transition-transform ${
                            expandedExpenseId === expense.id ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </div>
                    {expandedExpenseId === expense.id && (
                      <div className="border-t border-surface0 p-4">
                        <h4 className="font-medium text-sm mb-3">Split Breakdown</h4>
                        <div className="space-y-3">
                          {expense.participants.map(({ user, share }) => (
                            <div key={user.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar user={user} size="sm" />
                                <span className="text-sm">
                                  {user.id === currentUser.id ? "You" : user.name}
                                </span>
                              </div>
                              <span className="text-sm font-mono">${share.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
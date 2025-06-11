import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { currentUser } from '../lib/mockData';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';

export const GroupDetail: React.FC = () => {
  const { activeGroupId, groups, expenses, actions } = useAppStore();
  
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
  
  // Calculate balances for each member
  const calculateMemberBalances = () => {
    const balances: { [userId: string]: number } = {};
    
    // Initialize balances
    group.members.forEach(member => {
      balances[member.id] = 0;
    });
    
    // Calculate balances from expenses
    groupExpenses.forEach(expense => {
      expense.participants.forEach(participant => {
        if (expense.paidBy.id === participant.user.id) {
          // This person paid, so they are owed the difference
          balances[participant.user.id] += expense.amount - participant.share;
        } else {
          // This person didn't pay, so they owe their share
          balances[participant.user.id] -= participant.share;
        }
      });
    });
    
    return balances;
  };
  
  const memberBalances = calculateMemberBalances();
  
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
        {/* Balances Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Balances</h2>
          <div className="space-y-3">
            {group.members.map(member => {
              const balance = memberBalances[member.id];
              return (
                <Card key={member.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar user={member} />
                      <span className="font-medium">
                        {member.id === currentUser.id ? 'You' : member.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        balance > 0 ? 'text-green' : balance < 0 ? 'text-red' : 'text-subtext1'
                      }`}>
                        {balance > 0 ? '+' : ''}${balance.toFixed(2)}
                      </p>
                      <p className="text-xs text-subtext1">
                        {balance > 0 ? 'gets back' : balance < 0 ? 'owes' : 'settled up'}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
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
                <Card key={expense.id}>
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
                      <p className="text-xs text-subtext1">
                        ${(expense.amount / expense.participants.length).toFixed(2)} each
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
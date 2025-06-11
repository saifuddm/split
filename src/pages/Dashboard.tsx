import React from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { currentUser } from '../lib/mockdata';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const Dashboard: React.FC = () => {
  const { groups, expenses, actions } = useAppStore();
  
  // Calculate total amounts owed and owing
  const calculateTotals = () => {
    let totalOwed = 0; // Amount others owe you
    let totalOwing = 0; // Amount you owe others
    
    expenses.forEach(expense => {
      const userParticipant = expense.participants.find(p => p.user.id === currentUser.id);
      if (!userParticipant) return;
      
      if (expense.paidBy.id === currentUser.id) {
        // You paid, others owe you
        totalOwed += expense.amount - userParticipant.share;
      } else {
        // Someone else paid, you owe them
        totalOwing += userParticipant.share;
      }
    });
    
    return { totalOwed, totalOwing };
  };
  
  // Calculate net balance for a specific group
  const getGroupBalance = (groupId: string) => {
    const groupExpenses = expenses.filter(exp => exp.groupId === groupId);
    let balance = 0;
    
    groupExpenses.forEach(expense => {
      const userParticipant = expense.participants.find(p => p.user.id === currentUser.id);
      if (!userParticipant) return;
      
      if (expense.paidBy.id === currentUser.id) {
        balance += expense.amount - userParticipant.share;
      } else {
        balance -= userParticipant.share;
      }
    });
    
    return balance;
  };
  
  const { totalOwed, totalOwing } = calculateTotals();
  
  return (
    <div className="min-h-screen bg-base text-text p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <p className="text-sm text-subtext1 mb-1">Total you owe</p>
              <p className="text-xl font-bold text-red">${totalOwing.toFixed(2)}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-sm text-subtext1 mb-1">Total you are owed</p>
              <p className="text-xl font-bold text-green">${totalOwed.toFixed(2)}</p>
            </div>
          </Card>
        </div>
        
        {/* Groups Section */}
        <div className="mb-20">
          <h2 className="text-lg font-semibold mb-4">Groups</h2>
          <div className="space-y-3">
            {groups.map(group => {
              const balance = getGroupBalance(group.id);
              return (
                <Card
                  key={group.id}
                  onClick={() => actions.navigateTo('group-details', group.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{group.name}</h3>
                      <p className="text-sm text-subtext1">
                        {group.members.length} members
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        balance > 0 ? 'text-green' : balance < 0 ? 'text-red' : 'text-subtext1'
                      }`}>
                        {balance > 0 ? '+' : ''}${balance.toFixed(2)}
                      </p>
                      <p className="text-xs text-subtext1">
                        {balance > 0 ? 'you are owed' : balance < 0 ? 'you owe' : 'settled up'}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        
        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => actions.navigateTo('add-expense')}
            className="w-14 h-14 rounded-full shadow-lg"
          >
            <Plus size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
};
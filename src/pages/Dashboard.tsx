import React from 'react';
import { Plus, Users } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { currentUser, users } from '../lib/mockdata';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import type { User } from '../lib/types';

export const Dashboard: React.FC = () => {
  const { groups, expenses, actions } = useAppStore();
  
  // Calculate net balance between currentUser and each other user
  const calculatePersonalBalances = () => {
    const balances: { [userId: string]: number } = {};
    
    // Initialize balances for all users except current user
    users.forEach(user => {
      if (user.id !== currentUser.id) {
        balances[user.id] = 0;
      }
    });
    
    expenses.forEach(expense => {
      const currentUserParticipant = expense.participants.find(p => p.user.id === currentUser.id);
      if (!currentUserParticipant) return;
      
      if (expense.paidBy.id === currentUser.id) {
        // Current user paid, others owe them
        expense.participants.forEach(participant => {
          if (participant.user.id !== currentUser.id) {
            balances[participant.user.id] += participant.share;
          }
        });
      } else {
        // Someone else paid, current user owes them
        balances[expense.paidBy.id] -= currentUserParticipant.share;
      }
    });
    
    return balances;
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
  
  const personalBalances = calculatePersonalBalances();
  
  // Separate users who owe you vs users you owe
  const usersWhoOweYou = users.filter(user => 
    user.id !== currentUser.id && personalBalances[user.id] > 0
  );
  
  const usersYouOwe = users.filter(user => 
    user.id !== currentUser.id && personalBalances[user.id] < 0
  );
  
  return (
    <div className="min-h-screen bg-base text-text p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button
            onClick={() => actions.navigateTo('create-group')}
            size="sm"
            className="flex items-center gap-2"
          >
            <Users size={16} />
            Create Group
          </Button>
        </div>
        
        {/* Personal Balances Section */}
        <div className="mb-6">
          {/* Who Owes You */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-3">Who Owes You</h2>
            {usersWhoOweYou.length === 0 ? (
              <Card>
                <p className="text-center text-subtext1">You haven't lent any money.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {usersWhoOweYou.map(user => (
                  <Card key={user.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <p className="font-bold text-green">
                        +${personalBalances[user.id].toFixed(2)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Who You Owe */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Who You Owe</h2>
            {usersYouOwe.length === 0 ? (
              <Card>
                <p className="text-center text-subtext1">You're all settled up!</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {usersYouOwe.map(user => (
                  <Card key={user.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <p className="font-bold text-red">
                        ${Math.abs(personalBalances[user.id]).toFixed(2)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
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
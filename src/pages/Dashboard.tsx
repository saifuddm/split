import React from 'react';
import { Plus, Users, Handshake, Settings, Bell } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { calculateNetBalanceBetweenTwoUsers } from '../lib/utils';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';

export const Dashboard: React.FC = () => {
  const { currentUser, users, groups, expenses, actions } = useAppStore();
  
  // Calculate overall balances using the new utility function
  const overallBalances: { [userId: string]: number } = {};
  users.forEach(user => {
    if (user.id !== currentUser.id) {
      overallBalances[user.id] = calculateNetBalanceBetweenTwoUsers(
        currentUser,
        user,
        groups,
        expenses
      );
    }
  });
  
  // Calculate individual balances (non-group only) for the summary card
  const individualBalances: { [userId: string]: number } = {};
  users.forEach(user => {
    if (user.id !== currentUser.id) {
      individualBalances[user.id] = calculateNetBalanceBetweenTwoUsers(
        currentUser,
        user,
        [], // Empty groups array to calculate only individual expenses
        expenses
      );
    }
  });
  
  // Calculate net balance for a specific group (for group cards)
  const getGroupBalance = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return 0;
    
    let balance = 0;
    group.members.forEach(member => {
      if (member.id !== currentUser.id) {
        const groupExpenses = expenses.filter(exp => exp.groupId === groupId);
        const netBalance = calculateNetBalanceBetweenTwoUsers(
          currentUser,
          member,
          [group],
          groupExpenses
        );
        balance += netBalance;
      }
    });
    
    return balance;
  };

  const handleUserCardClick = (userId: string) => {
    actions.setPreselectedUserForExpense(userId);
    actions.navigateTo('add-expense');
  };
  
  // Separate users who owe you vs users you owe
  const usersWhoOweYou = users.filter(user => 
    user.id !== currentUser.id && overallBalances[user.id] > 0.01
  );
  
  const usersYouOwe = users.filter(user => 
    user.id !== currentUser.id && overallBalances[user.id] < -0.01
  );

  // Get other users for Quick Add (excluding current user)
  const otherUsers = users.filter(user => user.id !== currentUser.id);

  // Get users with individual balances for the summary
  const usersWithIndividualDebtsToYou = users.filter(user => 
    user.id !== currentUser.id && individualBalances[user.id] > 0.01
  );
  
  const usersYouOweIndividually = users.filter(user => 
    user.id !== currentUser.id && individualBalances[user.id] < -0.01
  );
  
  return (
    <div className="min-h-screen bg-base text-text p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => actions.navigateTo('activity')}
              variant="secondary"
              size="sm"
              className="p-2"
            >
              <Bell size={16} />
            </Button>
            <Button
              onClick={() => actions.navigateTo('settings')}
              variant="secondary"
              size="sm"
              className="p-2"
            >
              <Settings size={16} />
            </Button>
            <Button
              onClick={() => actions.navigateTo('create-group')}
              size="sm"
              className="flex items-center gap-2"
            >
              <Users size={16} />
              Create Group
            </Button>
          </div>
        </div>

        {/* Quick Add Section */}
        {otherUsers.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Add Expense with...</h2>
            <div className="flex overflow-x-auto gap-4 py-2">
              {otherUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleUserCardClick(user.id)}
                  className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-surface0 transition-colors cursor-pointer flex-shrink-0"
                >
                  <Avatar user={user} size="md" />
                  <span className="text-sm font-medium text-center whitespace-nowrap">
                    {user.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
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
                  <Card 
                    key={user.id}
                    onClick={() => handleUserCardClick(user.id)}
                    className="cursor-pointer hover:bg-surface0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <p className="font-bold text-green">
                        +${overallBalances[user.id].toFixed(2)}
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
                  <Card 
                    key={user.id}
                    onClick={() => handleUserCardClick(user.id)}
                    className="cursor-pointer hover:bg-surface0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <p className="font-bold text-red">
                        ${Math.abs(overallBalances[user.id]).toFixed(2)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Individual Expenses Summary Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Individual Expenses</h2>
          <Card 
            onClick={() => actions.navigateTo('individual-expenses')}
            className="cursor-pointer hover:bg-surface0 transition-colors"
          >
            {usersWithIndividualDebtsToYou.length === 0 && usersYouOweIndividually.length === 0 ? (
              <p className="text-center text-subtext1">All individual expenses are settled.</p>
            ) : (
              <div className="space-y-3">
                {usersWithIndividualDebtsToYou.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Who owes you:</h4>
                    <div className="space-y-1">
                      {usersWithIndividualDebtsToYou.map(user => (
                        <div key={user.id} className="flex justify-between text-sm">
                          <span className="text-subtext1">{user.name}</span>
                          <span className="font-medium text-green">
                            +${individualBalances[user.id].toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {usersYouOweIndividually.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">You owe:</h4>
                    <div className="space-y-1">
                      {usersYouOweIndividually.map(user => (
                        <div key={user.id} className="flex justify-between text-sm">
                          <span className="text-subtext1">{user.name}</span>
                          <span className="font-medium text-red">
                            ${Math.abs(individualBalances[user.id]).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-2 border-t border-surface0">
                  <p className="text-xs text-subtext0 text-center">
                    Tap to view all individual transactions
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
        
        {/* Groups Section */}
        <div className="mb-24 pb-24">
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
                        balance > 0.01 ? 'text-green' : balance < -0.01 ? 'text-red' : 'text-subtext1'
                      }`}>
                        {balance > 0.01 ? '+' : ''}${balance.toFixed(2)}
                      </p>
                      <p className="text-xs text-subtext1">
                        {balance > 0.01 ? 'you are owed' : balance < -0.01 ? 'you owe' : 'settled up'}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        
        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          {/* Settle Up Button */}
          {usersYouOwe.length > 0 && (
            <Button
              onClick={() => actions.navigateTo('settle-up')}
              className="w-14 h-14 rounded-full shadow-lg bg-green hover:bg-teal"
            >
              <Handshake size={24} />
            </Button>
          )}
          
          {/* Add Expense Button */}
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
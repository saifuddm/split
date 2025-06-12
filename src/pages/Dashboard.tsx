import React from 'react';
import { Plus, Users, Handshake, Settings } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { calculateSimplifiedDebts } from '../lib/utils';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';

export const Dashboard: React.FC = () => {
  const { currentUser, users, groups, expenses, actions } = useAppStore();
  
  // Calculate overall balances by first settling within each group, then aggregating
  const calculateOverallBalances = () => {
    const overallBalances: { [userId: string]: number } = {};
    
    // Initialize balances for all users except current user
    users.forEach(user => {
      if (user.id !== currentUser.id) {
        overallBalances[user.id] = 0;
      }
    });
    
    // Process each group separately
    groups.forEach(group => {
      // Get expenses for this specific group
      const groupExpenses = expenses.filter(exp => exp.groupId === group.id);
      
      // Calculate simplified debts within this group
      const simplifiedGroupDebts = calculateSimplifiedDebts(group.members, groupExpenses);
      
      // Aggregate the simplified debts into overall balances
      simplifiedGroupDebts.forEach(debt => {
        if (debt.debtor.id === currentUser.id) {
          // Current user owes money to the creditor
          overallBalances[debt.creditor.id] -= debt.amount;
        } else if (debt.creditor.id === currentUser.id) {
          // Current user is owed money by the debtor
          overallBalances[debt.debtor.id] += debt.amount;
        }
      });
    });

    // Process non-group expenses
    const nonGroupExpenses = expenses.filter(exp => !exp.groupId);
    nonGroupExpenses.forEach(expense => {
      if (expense.isSettlement) {
        // Special logic for settlement transactions
        if (expense.paidBy.id === currentUser.id) {
          // Current user paid someone
          overallBalances[expense.participants[0].user.id] += expense.amount;
        } else if (expense.participants[0].user.id === currentUser.id) {
          // Someone paid current user
          overallBalances[expense.paidBy.id] -= expense.amount;
        }
      } else {
        // Regular non-group expense
        expense.participants.forEach(participant => {
          if (participant.user.id === currentUser.id) {
            // Current user's involvement
            if (expense.paidBy.id === currentUser.id) {
              // Current user paid, so they are owed the difference
              overallBalances[participant.user.id] += expense.amount - participant.share;
            } else {
              // Current user didn't pay, so they owe their share to the payer
              overallBalances[expense.paidBy.id] -= participant.share;
            }
          } else if (expense.paidBy.id === currentUser.id) {
            // Current user paid for someone else
            overallBalances[participant.user.id] -= participant.share;
          }
        });
      }
    });
    
    return overallBalances;
  };
  
  // Calculate net balance for a specific group (for group cards)
  const getGroupBalance = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return 0;
    
    const groupExpenses = expenses.filter(exp => exp.groupId === groupId);
    const simplifiedGroupDebts = calculateSimplifiedDebts(group.members, groupExpenses);
    
    let balance = 0;
    simplifiedGroupDebts.forEach(debt => {
      if (debt.debtor.id === currentUser.id) {
        // Current user owes money
        balance -= debt.amount;
      } else if (debt.creditor.id === currentUser.id) {
        // Current user is owed money
        balance += debt.amount;
      }
    });
    
    return balance;
  };

  const handleUserCardClick = (userId: string) => {
    actions.setPreselectedUserForExpense(userId);
    actions.navigateTo('add-expense');
  };
  
  const overallBalances = calculateOverallBalances();
  
  // Separate users who owe you vs users you owe
  const usersWhoOweYou = users.filter(user => 
    user.id !== currentUser.id && overallBalances[user.id] > 0
  );
  
  const usersYouOwe = users.filter(user => 
    user.id !== currentUser.id && overallBalances[user.id] < 0
  );

  // Get other users for Quick Add (excluding current user)
  const otherUsers = users.filter(user => user.id !== currentUser.id);

  // Get non-group expenses for display
  const nonGroupExpenses = expenses.filter(exp => !exp.groupId && !exp.isSettlement);
  
  return (
    <div className="min-h-screen bg-base text-text p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
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

        {/* Individual Expenses Section */}
        {nonGroupExpenses.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Individual Expenses</h2>
            <div className="space-y-3">
              {nonGroupExpenses.map(expense => {
                const otherParticipant = expense.participants.find(p => p.user.id !== currentUser.id);
                const currentUserParticipant = expense.participants.find(p => p.user.id === currentUser.id);
                
                return (
                  <Card
                    key={expense.id}
                    onClick={() => actions.startEditingExpense(expense.id)}
                    className="cursor-pointer hover:bg-surface0 transition-colors"
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
                        {otherParticipant && (
                          <p className="text-sm text-subtext1 mt-1">
                            Expense with {otherParticipant.user.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${expense.amount.toFixed(2)}</p>
                        {currentUserParticipant && (
                          <p className="text-xs text-subtext1">
                            Your share: ${currentUserParticipant.share.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
        
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
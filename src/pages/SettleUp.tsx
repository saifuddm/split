import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Handshake } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { calculateSimplifiedDebts, calculateNetBalanceBetweenTwoUsers } from '../lib/utils';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import type { User } from '../lib/types';

export const SettleUp: React.FC = () => {
  const { currentUser, users, groups, expenses, actions } = useAppStore();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedSettlements, setSelectedSettlements] = useState<{ [groupId: string]: number }>({});
  const [individualDebtAmount, setIndividualDebtAmount] = useState(0);
  const [individualSettlementAmount, setIndividualSettlementAmount] = useState('0');
  const [includeIndividualDebt, setIncludeIndividualDebt] = useState(false);
  const [step, setStep] = useState<'select-user' | 'specify-amounts' | 'confirmation'>('select-user');

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
  
  // Get users you owe money to
  const usersYouOwe = users.filter(user => 
    user.id !== currentUser.id && overallBalances[user.id] < -0.01
  );

  // Calculate group-specific debts for the selected user
  const getGroupDebtsForUser = (user: User) => {
    const groupDebts: { groupId: string; groupName: string; amount: number }[] = [];
    
    groups.forEach(group => {
      // Only consider groups where both users are members
      if (!group.members.some(m => m.id === user.id) || !group.members.some(m => m.id === currentUser.id)) {
        return;
      }
      
      const groupExpenses = expenses.filter(exp => exp.groupId === group.id);
      const simplifiedGroupDebts = calculateSimplifiedDebts(group.members, groupExpenses);
      
      // Find debt from current user to selected user in this group
      const debt = simplifiedGroupDebts.find(d => 
        d.debtor.id === currentUser.id && d.creditor.id === user.id
      );
      
      if (debt && debt.amount > 0.01) {
        groupDebts.push({
          groupId: group.id,
          groupName: group.name,
          amount: debt.amount
        });
      }
    });
    
    return groupDebts;
  };

  const selectedUserGroupDebts = selectedUser ? getGroupDebtsForUser(selectedUser) : [];

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    const groupDebts = getGroupDebtsForUser(user);
    
    // Calculate individual debt using the new utility function
    const individualDebt = calculateNetBalanceBetweenTwoUsers(
      currentUser,
      user,
      [], // Empty groups array to calculate only individual expenses
      expenses
    );
    
    // Initialize selected settlements with all group debts
    const initialSettlements: { [groupId: string]: number } = {};
    groupDebts.forEach(debt => {
      initialSettlements[debt.groupId] = debt.amount;
    });
    setSelectedSettlements(initialSettlements);
    
    // Set individual debt (only if current user owes money)
    const individualDebtOwed = Math.abs(Math.min(0, individualDebt));
    setIndividualDebtAmount(individualDebtOwed);
    setIndividualSettlementAmount(individualDebtOwed.toString());
    setIncludeIndividualDebt(individualDebtOwed > 0.01);
    
    setStep('specify-amounts');
  };

  const handleAmountChange = (groupId: string, amount: string) => {
    const numericAmount = parseFloat(amount) || 0;
    setSelectedSettlements(prev => ({
      ...prev,
      [groupId]: numericAmount
    }));
  };

  const handleGroupToggle = (groupId: string, originalAmount: number) => {
    setSelectedSettlements(prev => {
      const current = prev[groupId] || 0;
      return {
        ...prev,
        [groupId]: current > 0 ? 0 : originalAmount
      };
    });
  };

  const totalGroupSettlement = Object.values(selectedSettlements).reduce((sum, amount) => sum + amount, 0);
  const totalIndividualSettlement = includeIndividualDebt ? parseFloat(individualSettlementAmount) || 0 : 0;
  const totalSettlementAmount = totalGroupSettlement + totalIndividualSettlement;
  const activeSettlements = Object.entries(selectedSettlements).filter(([_, amount]) => amount > 0);

  const handleConfirmSettlement = () => {
    if (!selectedUser || totalSettlementAmount <= 0) return;
    
    const settlements = activeSettlements.map(([groupId, amount]) => ({
      groupId,
      amount
    }));
    
    // Add individual settlement if selected
    if (includeIndividualDebt && totalIndividualSettlement > 0) {
      settlements.push({
        groupId: '', // Empty groupId for individual settlement
        amount: totalIndividualSettlement
      });
    }
    
    actions.recordSettlement(selectedUser, settlements);
    actions.navigateTo('dashboard');
  };

  const handleBack = () => {
    if (step === 'specify-amounts') {
      setStep('select-user');
      setSelectedUser(null);
      setSelectedSettlements({});
      setIndividualDebtAmount(0);
      setIndividualSettlementAmount('0');
      setIncludeIndividualDebt(false);
    } else if (step === 'confirmation') {
      setStep('specify-amounts');
    } else {
      actions.navigateTo('dashboard');
    }
  };

  const handleNext = () => {
    if (step === 'specify-amounts' && totalSettlementAmount > 0) {
      setStep('confirmation');
    }
  };

  return (
    <div className="min-h-screen bg-base text-text">
      {/* Header */}
      <div className="bg-mantle border-b border-surface0 p-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBack}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Settle Up</h1>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4">
        {/* Step 1: Select User */}
        {step === 'select-user' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Handshake className="w-12 h-12 text-blue mx-auto mb-2" />
              <h2 className="text-lg font-semibold mb-2">Who do you want to pay?</h2>
              <p className="text-sm text-subtext1">Select someone you owe money to</p>
            </div>
            
            {usersYouOwe.length === 0 ? (
              <Card>
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">You're all settled up!</h3>
                  <p className="text-sm text-subtext1">You don't owe anyone money right now.</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {usersYouOwe.map(user => (
                  <Card
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="cursor-pointer hover:bg-surface0 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div>
                          <span className="font-medium">{user.name}</span>
                          {user.paymentMessage && (
                            <p className="text-xs text-subtext1">{user.paymentMessage}</p>
                          )}
                        </div>
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
        )}

        {/* Step 2: Specify Amounts */}
        {step === 'specify-amounts' && selectedUser && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Avatar user={selectedUser} size="lg" className="mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-2">Paying {selectedUser.name}</h2>
              <p className="text-sm text-subtext1">Choose which debts to settle</p>
            </div>
            
            <div className="space-y-4">
              {/* Group Debts Section */}
              {selectedUserGroupDebts.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">Group Debts</h3>
                  <div className="space-y-3">
                    {selectedUserGroupDebts.map(debt => {
                      const isSelected = selectedSettlements[debt.groupId] > 0;
                      const currentAmount = selectedSettlements[debt.groupId] || 0;
                      
                      return (
                        <Card key={debt.groupId} className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleGroupToggle(debt.groupId, debt.amount)}
                              className="text-blue focus:ring-blue"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium">{debt.groupName}</h4>
                              <p className="text-sm text-subtext1">You owe ${debt.amount.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          {isSelected && (
                            <div className="ml-6">
                              <label className="block text-sm font-medium mb-2">
                                Amount to pay
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-subtext1">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={debt.amount}
                                  value={currentAmount}
                                  onChange={(e) => handleAmountChange(debt.groupId, e.target.value)}
                                  className="w-full pl-8 pr-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                                />
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Individual Debts Section */}
              {individualDebtAmount > 0.01 && (
                <div>
                  <h3 className="font-medium mb-3">Individual Debts</h3>
                  <Card className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={includeIndividualDebt}
                        onChange={(e) => setIncludeIndividualDebt(e.target.checked)}
                        className="text-blue focus:ring-blue"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">Direct Expenses</h4>
                        <p className="text-sm text-subtext1">
                          You owe ${individualDebtAmount.toFixed(2)} from individual expenses
                        </p>
                      </div>
                    </div>
                    
                    {includeIndividualDebt && (
                      <div className="ml-6">
                        <label className="block text-sm font-medium mb-2">
                          Amount to pay
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-subtext1">
                            $
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={individualDebtAmount}
                            value={individualSettlementAmount}
                            onChange={(e) => setIndividualSettlementAmount(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </div>
            
            {totalSettlementAmount > 0 && (
              <div className="bg-surface0 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Payment:</span>
                  <span className="text-xl font-bold text-blue">
                    ${totalSettlementAmount.toFixed(2)}
                  </span>
                </div>
                {totalGroupSettlement > 0 && totalIndividualSettlement > 0 && (
                  <div className="mt-2 text-sm text-subtext1">
                    <div className="flex justify-between">
                      <span>Group debts:</span>
                      <span>${totalGroupSettlement.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Individual debts:</span>
                      <span>${totalIndividualSettlement.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <Button
              onClick={handleNext}
              disabled={totalSettlementAmount <= 0}
              className={`w-full ${totalSettlementAmount <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirmation' && selectedUser && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <CheckCircle className="w-12 h-12 text-green mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-2">Confirm Payment</h2>
              <p className="text-sm text-subtext1">Review your settlement details</p>
            </div>
            
            <Card className="p-6">
              <div className="text-center mb-4">
                <Avatar user={selectedUser} size="lg" className="mx-auto mb-3" />
                <h3 className="text-xl font-semibold">
                  Paying {selectedUser.name}
                </h3>
                <p className="text-3xl font-bold text-blue mt-2">
                  ${totalSettlementAmount.toFixed(2)}
                </p>
              </div>
              
              {selectedUser.paymentMessage && (
                <div className="bg-surface0 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium mb-1">Payment Method:</p>
                  <p className="text-sm text-subtext1">{selectedUser.paymentMessage}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Settlement Breakdown:</h4>
                {activeSettlements.map(([groupId, amount]) => {
                  const group = groups.find(g => g.id === groupId);
                  return (
                    <div key={groupId} className="flex justify-between text-sm">
                      <span className="text-subtext1">{group?.name}</span>
                      <span className="font-medium">${amount.toFixed(2)}</span>
                    </div>
                  );
                })}
                {includeIndividualDebt && totalIndividualSettlement > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-subtext1">Individual expenses</span>
                    <span className="font-medium">${totalIndividualSettlement.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </Card>
            
            <div className="space-y-3">
              <Button
                onClick={handleConfirmSettlement}
                className="w-full"
              >
                Confirm & Settle Up
              </Button>
              <Button
                variant="secondary"
                onClick={() => setStep('specify-amounts')}
                className="w-full"
              >
                Back to Edit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
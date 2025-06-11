import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { currentUser } from '../lib/mockdata';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Switch } from '../components/Switch';
import type { User, SplitMethod } from '../lib/types';

export const AddExpense: React.FC = () => {
  const { activeGroupId, editingExpenseId, groups, expenses, actions } = useAppStore();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(activeGroupId || '');
  const [paidBy, setPaidBy] = useState<User>(currentUser);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([]);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equally');
  const [exactAmounts, setExactAmounts] = useState<{ [userId: string]: string }>({});
  const [percentages, setPercentages] = useState<{ [userId: string]: string }>({});
  const [isOwedFullAmount, setIsOwedFullAmount] = useState(false);
  
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const isEditMode = editingExpenseId !== null;
  const editingExpense = isEditMode ? expenses.find(e => e.id === editingExpenseId) : null;
  
  // Memoized participants who will actually split the cost
  const participantsToSplit = useMemo(() => {
    if (isOwedFullAmount && paidBy.id === currentUser.id) {
      return selectedParticipants.filter(p => p.id !== currentUser.id);
    }
    return selectedParticipants;
  }, [isOwedFullAmount, paidBy.id, selectedParticipants]);
  
  // Pre-fill form when in edit mode
  useEffect(() => {
    if (isEditMode && editingExpense) {
      setDescription(editingExpense.description);
      setAmount(editingExpense.amount.toString());
      setSelectedGroupId(editingExpense.groupId);
      setPaidBy(editingExpense.paidBy);
      setSelectedParticipants(editingExpense.participants.map(p => p.user));
      
      // Check if it's an advanced split (not equal shares)
      const totalAmount = editingExpense.amount;
      const equalShare = totalAmount / editingExpense.participants.length;
      const isEqualSplit = editingExpense.participants.every(p => 
        Math.abs(p.share - equalShare) < 0.01
      );
      
      if (!isEqualSplit) {
        setIsAdvanced(true);
        setSplitMethod('exact');
        const exactAmountsMap: { [userId: string]: string } = {};
        editingExpense.participants.forEach(p => {
          exactAmountsMap[p.user.id] = p.share.toString();
        });
        setExactAmounts(exactAmountsMap);
      }
    }
  }, [isEditMode, editingExpense]);
  
  // Update paidBy and participants when group changes
  useEffect(() => {
    if (selectedGroup) {
      if (!selectedGroup.members.find(m => m.id === paidBy.id)) {
        setPaidBy(currentUser);
      }
      // In simple mode, all members are participants
      if (!isAdvanced) {
        setSelectedParticipants(selectedGroup.members);
      } else if (selectedParticipants.length === 0 && !isEditMode) {
        // Initialize with all members in advanced mode (but not when editing)
        setSelectedParticipants(selectedGroup.members);
      }
    }
  }, [selectedGroupId, selectedGroup, paidBy.id, isAdvanced, isEditMode]);
  
  // Reset advanced settings when switching modes
  useEffect(() => {
    if (!isAdvanced && selectedGroup && !isEditMode) {
      setSelectedParticipants(selectedGroup.members);
      setSplitMethod('equally');
      setExactAmounts({});
      setPercentages({});
      setIsOwedFullAmount(false);
    }
  }, [isAdvanced, selectedGroup, isEditMode]);
  
  const handleParticipantToggle = (user: User) => {
    setSelectedParticipants(prev => {
      const isSelected = prev.some(p => p.id === user.id);
      if (isSelected) {
        return prev.filter(p => p.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };
  
  const handleExactAmountChange = (userId: string, value: string) => {
    setExactAmounts(prev => ({ ...prev, [userId]: value }));
  };
  
  const handlePercentageChange = (userId: string, value: string) => {
    setPercentages(prev => ({ ...prev, [userId]: value }));
  };
  
  const calculateSplitAmounts = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0 || participantsToSplit.length === 0) {
      return {};
    }
    
    const amounts: { [userId: string]: number } = {};
    
    if (splitMethod === 'equally') {
      const sharePerPerson = numericAmount / participantsToSplit.length;
      participantsToSplit.forEach(participant => {
        amounts[participant.id] = sharePerPerson;
      });
    } else if (splitMethod === 'exact') {
      participantsToSplit.forEach(participant => {
        const exactAmount = parseFloat(exactAmounts[participant.id] || '0');
        amounts[participant.id] = isNaN(exactAmount) ? 0 : exactAmount;
      });
    } else if (splitMethod === 'percentage') {
      participantsToSplit.forEach(participant => {
        const percentage = parseFloat(percentages[participant.id] || '0');
        amounts[participant.id] = isNaN(percentage) ? 0 : (numericAmount * percentage) / 100;
      });
    }
    
    return amounts;
  };
  
  const validateSplit = () => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) return { isValid: false, error: '' };
    
    if (participantsToSplit.length === 0) {
      return { isValid: false, error: 'At least one person must be involved in the split' };
    }
    
    const splitAmounts = calculateSplitAmounts();
    const totalSplit = Object.values(splitAmounts).reduce((sum, amt) => sum + amt, 0);
    
    if (splitMethod === 'exact') {
      const difference = Math.abs(totalSplit - numericAmount);
      if (difference > 0.01) { // Allow for small rounding differences
        return { 
          isValid: false, 
          error: `Split amounts total $${totalSplit.toFixed(2)}, but expense is $${numericAmount.toFixed(2)}` 
        };
      }
    } else if (splitMethod === 'percentage') {
      const totalPercentage = participantsToSplit.reduce((sum, participant) => {
        const percentage = parseFloat(percentages[participant.id] || '0');
        return sum + (isNaN(percentage) ? 0 : percentage);
      }, 0);
      
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return { 
          isValid: false, 
          error: `Percentages total ${totalPercentage.toFixed(1)}%, but should equal 100%` 
        };
      }
    }
    
    return { isValid: true, error: '' };
  };
  
  const handleSave = () => {
    if (!description.trim() || !amount || !selectedGroupId || !selectedGroup) {
      return;
    }
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }
    
    if (selectedParticipants.length === 0) {
      return;
    }
    
    const validation = validateSplit();
    if (!validation.isValid) {
      return;
    }
    
    const splitAmounts = calculateSplitAmounts();
    const participants = Object.entries(splitAmounts).map(([userId, share]) => ({
      user: selectedParticipants.find(p => p.id === userId)!,
      share,
    }));
    
    const expenseData = {
      groupId: selectedGroupId,
      description: description.trim(),
      amount: numericAmount,
      paidBy,
      participants,
      date: isEditMode && editingExpense ? editingExpense.date : new Date().toISOString(),
    };
    
    if (isEditMode && editingExpenseId) {
      actions.updateExpense(editingExpenseId, expenseData);
    } else {
      actions.addExpense(expenseData);
    }
    
    actions.navigateTo('group-details', selectedGroupId);
  };
  
  const handleCancel = () => {
    if (isEditMode) {
      actions.clearEditingExpense();
    }
    
    if (activeGroupId) {
      actions.navigateTo('group-details', activeGroupId);
    } else {
      actions.navigateTo('dashboard');
    }
  };
  
  const validation = validateSplit();
  const isFormValid = description.trim() && 
                     amount && 
                     selectedGroupId && 
                     parseFloat(amount) > 0 && 
                     selectedParticipants.length > 0 &&
                     validation.isValid;
  
  return (
    <div className="min-h-screen bg-base text-text">
      {/* Header */}
      <div className="bg-mantle border-b border-surface0 p-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <h1 className="text-xl font-bold">
            {isEditMode ? 'Edit Expense' : 'Add Expense'}
          </h1>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isFormValid}
            className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {isEditMode ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4">
        <div className="space-y-6">
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              className="w-full px-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
            />
          </div>
          
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-subtext1">
                $
              </span>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Group Selection */}
          <div>
            <label htmlFor="group" className="block text-sm font-medium mb-2">
              Group
            </label>
            <select
              id="group"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
            >
              <option value="">Select a group</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Paid By */}
          {selectedGroup && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Paid by
              </label>
              <div className="space-y-2">
                {selectedGroup.members.map(member => (
                  <label
                    key={member.id}
                    className="flex items-center gap-3 p-3 bg-mantle border border-surface0 rounded-lg cursor-pointer hover:bg-surface0 transition-colors"
                  >
                    <input
                      type="radio"
                      name="paidBy"
                      value={member.id}
                      checked={paidBy.id === member.id}
                      onChange={() => setPaidBy(member)}
                      className="text-blue focus:ring-blue"
                    />
                    <Avatar user={member} size="sm" />
                    <span className="font-medium">
                      {member.id === currentUser.id ? 'You' : member.name}
                    </span>
                  </label>
                ))}
              </div>
              
              {/* Owed Full Amount Option */}
              {paidBy.id === currentUser.id && isAdvanced && (
                <div className="mt-3 p-3 bg-surface0 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOwedFullAmount}
                      onChange={(e) => setIsOwedFullAmount(e.target.checked)}
                      className="text-blue focus:ring-blue"
                    />
                    <span className="text-sm font-medium">I am owed the full amount</span>
                  </label>
                  <p className="text-xs text-subtext1 mt-1">
                    You won't be included in the split calculation
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Advanced Toggle */}
          {selectedGroup && (
            <div className="border-t border-surface0 pt-4">
              <Switch
                checked={isAdvanced}
                onChange={setIsAdvanced}
                label="Advanced split"
              />
            </div>
          )}
          
          {/* Advanced Options */}
          {isAdvanced && selectedGroup && (
            <>
              {/* Participant Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Who was involved?
                </label>
                <div className="space-y-2">
                  {selectedGroup.members.map(member => (
                    <label
                      key={member.id}
                      className="flex items-center gap-3 p-3 bg-mantle border border-surface0 rounded-lg cursor-pointer hover:bg-surface0 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.some(p => p.id === member.id)}
                        onChange={() => handleParticipantToggle(member)}
                        className="text-blue focus:ring-blue"
                      />
                      <Avatar user={member} size="sm" />
                      <span className="font-medium">
                        {member.id === currentUser.id ? 'You' : member.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Split Method */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  How should this be split?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['equally', 'exact', 'percentage'] as SplitMethod[]).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSplitMethod(method)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        splitMethod === method
                          ? 'bg-blue text-base border-blue'
                          : 'bg-mantle text-text border-surface0 hover:bg-surface0'
                      }`}
                    >
                      {method === 'equally' ? 'Equally' : 
                       method === 'exact' ? 'Exact Amounts' : 'Percentage'}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Split Details */}
              {selectedParticipants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Split details
                  </label>
                  
                  {splitMethod === 'equally' && (
                    <div className="bg-surface0 p-4 rounded-lg">
                      <p className="text-sm text-subtext1">
                        Split equally among {participantsToSplit.length} people
                      </p>
                      {amount && parseFloat(amount) > 0 && participantsToSplit.length > 0 && (
                        <p className="text-sm text-subtext1 mt-1">
                          ${(parseFloat(amount) / participantsToSplit.length).toFixed(2)} each
                        </p>
                      )}
                    </div>
                  )}
                  
                  {splitMethod === 'exact' && (
                    <div className="space-y-3">
                      {participantsToSplit.map(participant => (
                        <div key={participant.id} className="flex items-center gap-3">
                          <Avatar user={participant} size="sm" />
                          <span className="font-medium flex-1">
                            {participant.id === currentUser.id ? 'You' : participant.name}
                          </span>
                          <div className="relative w-24">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-subtext1 text-sm">
                              $
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={exactAmounts[participant.id] || ''}
                              onChange={(e) => handleExactAmountChange(participant.id, e.target.value)}
                              className="w-full pl-6 pr-2 py-1 text-sm bg-mantle border border-surface0 rounded focus:outline-none focus:ring-1 focus:ring-blue"
                            />
                          </div>
                        </div>
                      ))}
                      {!validation.isValid && validation.error && (
                        <p className="text-sm text-red">{validation.error}</p>
                      )}
                    </div>
                  )}
                  
                  {splitMethod === 'percentage' && (
                    <div className="space-y-3">
                      {participantsToSplit.map(participant => (
                        <div key={participant.id} className="flex items-center gap-3">
                          <Avatar user={participant} size="sm" />
                          <span className="font-medium flex-1">
                            {participant.id === currentUser.id ? 'You' : participant.name}
                          </span>
                          <div className="relative w-24">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={percentages[participant.id] || ''}
                              onChange={(e) => handlePercentageChange(participant.id, e.target.value)}
                              className="w-full pl-2 pr-6 py-1 text-sm bg-mantle border border-surface0 rounded focus:outline-none focus:ring-1 focus:ring-blue"
                            />
                            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-subtext1 text-sm">
                              %
                            </span>
                          </div>
                        </div>
                      ))}
                      {!validation.isValid && validation.error && (
                        <p className="text-sm text-red">{validation.error}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          {/* Simple Split Info */}
          {!isAdvanced && selectedGroup && (
            <div className="bg-surface0 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Split</h3>
              <p className="text-sm text-subtext1">
                Split equally among {selectedGroup.members.length} members
              </p>
              {amount && parseFloat(amount) > 0 && (
                <p className="text-sm text-subtext1 mt-1">
                  ${(parseFloat(amount) / selectedGroup.members.length).toFixed(2)} each
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
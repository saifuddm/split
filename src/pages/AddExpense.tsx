import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { currentUser } from '../lib/mockdata';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import type { User } from '../lib/types';

export const AddExpense: React.FC = () => {
  const { activeGroupId, groups, actions } = useAppStore();
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(activeGroupId || '');
  const [paidBy, setPaidBy] = useState<User>(currentUser);
  
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  
  // Update paidBy when group changes
  useEffect(() => {
    if (selectedGroup && !selectedGroup.members.find(m => m.id === paidBy.id)) {
      setPaidBy(currentUser);
    }
  }, [selectedGroupId, selectedGroup, paidBy.id]);
  
  const handleSave = () => {
    if (!description.trim() || !amount || !selectedGroupId || !selectedGroup) {
      return;
    }
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return;
    }
    
    // Calculate equal split
    const sharePerPerson = numericAmount / selectedGroup.members.length;
    const participants = selectedGroup.members.map(member => ({
      user: member,
      share: sharePerPerson,
    }));
    
    const newExpense = {
      groupId: selectedGroupId,
      description: description.trim(),
      amount: numericAmount,
      paidBy,
      participants,
      date: new Date().toISOString(),
    };
    
    actions.addExpense(newExpense);
    actions.navigateTo('group-details', selectedGroupId);
  };
  
  const handleCancel = () => {
    if (activeGroupId) {
      actions.navigateTo('group-details', activeGroupId);
    } else {
      actions.navigateTo('dashboard');
    }
  };
  
  const isFormValid = description.trim() && amount && selectedGroupId && parseFloat(amount) > 0;
  
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
          <h1 className="text-xl font-bold">Add Expense</h1>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isFormValid}
            className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Save
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
            </div>
          )}
          
          {/* Split Info */}
          {selectedGroup && (
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
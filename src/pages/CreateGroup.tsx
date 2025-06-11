import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { currentUser, users } from '../lib/mockdata';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import type { User } from '../lib/types';

export const CreateGroup: React.FC = () => {
  const { actions } = useAppStore();
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  
  // Get all users except the current user
  const availableUsers = users.filter(user => user.id !== currentUser.id);
  
  const handleMemberToggle = (user: User) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(member => member.id === user.id);
      if (isSelected) {
        return prev.filter(member => member.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };
  
  const handleCreateGroup = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      actions.createGroup(groupName.trim(), selectedMembers);
    }
  };
  
  const isFormValid = groupName.trim() && selectedMembers.length > 0;
  
  return (
    <div className="min-h-screen bg-base text-text">
      {/* Header */}
      <div className="bg-mantle border-b border-surface0 p-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => actions.navigateTo('dashboard')}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Create a New Group</h1>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4">
        <div className="space-y-6">
          {/* Group Name */}
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium mb-2">
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Ski Trip"
              className="w-full px-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
            />
          </div>
          
          {/* Members Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Members
            </label>
            <p className="text-xs text-subtext1 mb-3">
              You are automatically included in the group
            </p>
            
            <div className="space-y-2">
              {availableUsers.map(user => (
                <label
                  key={user.id}
                  className="flex items-center gap-3 p-3 bg-mantle border border-surface0 rounded-lg cursor-pointer hover:bg-surface0 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedMembers.some(member => member.id === user.id)}
                    onChange={() => handleMemberToggle(user)}
                    className="text-blue focus:ring-blue"
                  />
                  <Avatar user={user} size="sm" />
                  <span className="font-medium">{user.name}</span>
                </label>
              ))}
            </div>
            
            {selectedMembers.length > 0 && (
              <p className="text-sm text-subtext1 mt-2">
                {selectedMembers.length + 1} members selected (including you)
              </p>
            )}
          </div>
          
          {/* Create Button */}
          <div className="pt-4">
            <Button
              onClick={handleCreateGroup}
              disabled={!isFormValid}
              className={`w-full ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Create Group
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { ArrowLeft, Mail, X } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import type { User } from '../lib/types';

export const CreateGroup: React.FC = () => {
  const { currentUser, users, isLoading, error, actions } = useAppStore();
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  
  // Get all users except the current user
  const availableUsers = users.filter(user => user.id !== currentUser?.id);
  
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

  const handleAddMemberByEmail = async () => {
    if (!newMemberEmail.trim()) return;

    try {
      // First, invite the user by email
      await actions.inviteUserByEmail(newMemberEmail.trim());
      
      // Find the newly invited user and add them to selected members
      const updatedUsers = await actions.loadInitialData();
      const invitedUser = users.find(user => user.email === newMemberEmail.trim());
      
      if (invitedUser && !selectedMembers.some(m => m.id === invitedUser.id)) {
        setSelectedMembers(prev => [...prev, invitedUser]);
      }
      
      setNewMemberEmail('');
      setIsAddingMember(false);
    } catch (err) {
      console.error('Failed to invite user:', err);
    }
  };
  
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    
    try {
      const memberEmails = selectedMembers.map(member => member.email).filter(Boolean) as string[];
      await actions.createGroup(groupName.trim(), memberEmails);
      
      // Navigate back to dashboard after successful creation
      window.history.back();
    } catch (err) {
      console.error('Failed to create group:', err);
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
            onClick={() => window.history.back()}
            className="p-2"
            disabled={isLoading}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Create a New Group</h1>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4">
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red/10 border border-red/20 rounded-lg">
            <p className="text-red text-sm">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={actions.clearError}
              className="mt-2"
            >
              Dismiss
            </Button>
          </div>
        )}

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
              disabled={isLoading}
            />
          </div>
          
          {/* Members Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                Members
              </label>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsAddingMember(true)}
                className="flex items-center gap-1"
                disabled={isLoading}
              >
                <Mail size={14} />
                Invite by Email
              </Button>
            </div>
            
            <p className="text-xs text-subtext1 mb-3">
              You are automatically included in the group
            </p>

            {/* Add Member by Email */}
            {isAddingMember && (
              <div className="mb-4 p-3 bg-surface0 rounded-lg">
                <div className="space-y-3">
                  <label htmlFor="memberEmail" className="block text-sm font-medium">
                    Email Address
                  </label>
                  <input
                    id="memberEmail"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="friend@example.com"
                    className="w-full px-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddMemberByEmail();
                      } else if (e.key === 'Escape') {
                        setIsAddingMember(false);
                        setNewMemberEmail('');
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddMemberByEmail}
                      size="sm"
                      disabled={isLoading || !newMemberEmail.trim()}
                      className={!newMemberEmail.trim() ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      {isLoading ? 'Adding...' : 'Add Member'}
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAddingMember(false);
                        setNewMemberEmail('');
                      }}
                      variant="secondary"
                      size="sm"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Existing Users */}
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
                    disabled={isLoading}
                  />
                  <Avatar user={user} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      {user.isInvited && (
                        <span className="px-2 py-1 text-xs bg-yellow/20 text-yellow rounded-full">
                          Invited
                        </span>
                      )}
                    </div>
                    {user.email && (
                      <p className="text-xs text-subtext1">{user.email}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
            
            {/* Selected Members Summary */}
            {selectedMembers.length > 0 && (
              <div className="mt-4 p-3 bg-surface0 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Selected Members:</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 bg-mantle px-2 py-1 rounded-full text-sm"
                    >
                      <Avatar user={member} size="xs" />
                      <span>{member.name}</span>
                      <button
                        onClick={() => handleMemberToggle(member)}
                        className="text-subtext1 hover:text-red transition-colors"
                        disabled={isLoading}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-subtext1 mt-2">
                  {selectedMembers.length + 1} members total (including you)
                </p>
              </div>
            )}
          </div>
          
          {/* Create Button */}
          <div className="pt-4">
            <Button
              onClick={handleCreateGroup}
              disabled={!isFormValid || isLoading}
              className={`w-full ${!isFormValid || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Creating Group...' : 'Create Group'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
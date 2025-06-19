import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Mail, User as UserIcon } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { useStore } from '../data/store';
import { Button } from '../components/Button';
import { Switch } from '../components/Switch';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';

export const Settings: React.FC = () => {
  const { currentUser, users, isLoading, error, actions } = useAppStore();
  const { isDark, toggleDarkMode } = useStore();
  const [paymentMessage, setPaymentMessage] = useState(currentUser?.paymentMessage || '');
  const [isInviting, setIsInviting] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');

  // Get all users except the current user
  const otherUsers = users.filter(user => user.id !== currentUser?.id);

  const handleSavePaymentMessage = async () => {
    if (!currentUser) return;
    
    try {
      await actions.updateCurrentUser({ paymentMessage: paymentMessage.trim() || undefined });
    } catch (err) {
      console.error('Failed to save payment message:', err);
    }
  };

  const handleInviteUser = async () => {
    if (!newUserEmail.trim()) return;
    
    try {
      await actions.inviteUserByEmail(newUserEmail.trim(), newUserName.trim() || undefined);
      setNewUserEmail('');
      setNewUserName('');
      setIsInviting(false);
    } catch (err) {
      console.error('Failed to invite user:', err);
    }
  };

  const handleCancelInvite = () => {
    setNewUserEmail('');
    setNewUserName('');
    setIsInviting(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-base text-text flex items-center justify-center">
        <p>Loading user data...</p>
      </div>
    );
  }

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
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
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
          {/* User Profile Section */}
          <div className="bg-mantle rounded-lg p-4 border border-surface0">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>
            
            <div className="flex items-center gap-4 mb-4">
              <Avatar user={currentUser} size="lg" />
              <div>
                <h3 className="font-medium text-lg">{currentUser.name}</h3>
                <p className="text-sm text-subtext1">{currentUser.email}</p>
              </div>
            </div>
          </div>

          {/* Payment Information Section */}
          <div className="bg-mantle rounded-lg p-4 border border-surface0">
            <h2 className="text-lg font-semibold mb-4">Your Payment Info</h2>
            <p className="text-sm text-subtext1 mb-3">
              Add your payment details so friends know how to pay you back
            </p>
            
            <div className="space-y-3">
              <label htmlFor="paymentMessage" className="block text-sm font-medium">
                Payment Method
              </label>
              <textarea
                id="paymentMessage"
                value={paymentMessage}
                onChange={(e) => setPaymentMessage(e.target.value)}
                placeholder="e.g., Venmo: @your-username, CashApp: $your-handle, or Zelle: your-email@example.com"
                rows={3}
                className="w-full px-3 py-2 bg-base border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent resize-none"
                disabled={isLoading}
              />
              <p className="text-xs text-subtext0">
                This will be shown to others when they need to pay you
              </p>
              
              <Button
                onClick={handleSavePaymentMessage}
                size="sm"
                disabled={isLoading || paymentMessage.trim() === (currentUser.paymentMessage || '')}
                className={paymentMessage.trim() === (currentUser.paymentMessage || '') ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isLoading ? 'Saving...' : 'Save Payment Info'}
              </Button>
            </div>
          </div>

          {/* All Users Section */}
          <div className="bg-mantle rounded-lg p-4 border border-surface0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">All Users</h2>
              <Button
                onClick={() => setIsInviting(true)}
                size="sm"
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <UserPlus size={16} />
                Invite User
              </Button>
            </div>

            {/* Invite User Form */}
            {isInviting && (
              <div className="mb-4 p-3 bg-surface0 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="newUserEmail" className="block text-sm font-medium mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-subtext1" size={16} />
                      <input
                        id="newUserEmail"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full pl-10 pr-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="newUserName" className="block text-sm font-medium mb-1">
                      Display Name (Optional)
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-subtext1" size={16} />
                      <input
                        id="newUserName"
                        type="text"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-xs text-subtext0 mt-1">
                      If not provided, we'll use the part before @ in their email
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInviteUser}
                      size="sm"
                      disabled={isLoading || !newUserEmail.trim()}
                      className={!newUserEmail.trim() ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      {isLoading ? 'Inviting...' : 'Send Invite'}
                    </Button>
                    <Button
                      onClick={handleCancelInvite}
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

            {/* Users List */}
            <div className="space-y-2">
              {otherUsers.length === 0 ? (
                <p className="text-center text-subtext1 py-4">
                  No other users yet. Invite someone to get started!
                </p>
              ) : (
                otherUsers.map(user => (
                  <Card key={user.id} className="p-3">
                    <div className="flex items-center gap-3">
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
                        {user.paymentMessage && (
                          <p className="text-xs text-subtext1">{user.paymentMessage}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Theme Section */}
          <div className="bg-mantle rounded-lg p-4 border border-surface0">
            <h2 className="text-lg font-semibold mb-4">Appearance</h2>
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-subtext1">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                checked={isDark}
                onChange={toggleDarkMode}
              />
            </div>
          </div>

          {/* App Information */}
          <div className="bg-mantle rounded-lg p-4 border border-surface0">
            <h2 className="text-lg font-semibold mb-4">About</h2>
            <div className="space-y-2 text-sm text-subtext1">
              <p><span className="font-medium text-text">Version:</span> 2.0.0</p>
              <p><span className="font-medium text-text">Built with:</span> React, TypeScript, Tailwind CSS, Supabase</p>
              <p>
                <span className="font-medium text-text">Source:</span>{' '}
                <a 
                  href="https://github.com/saifuddm/split" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue hover:text-sapphire transition-colors underline"
                >
                  GitHub
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
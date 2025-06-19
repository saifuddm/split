import React, { useState } from 'react';
import { ArrowLeft, UserPlus, Mail, User as UserIcon, LogOut, Trash2, AlertTriangle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../data/useAppStore';
import { useStore } from '../data/store';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Switch } from '../components/Switch';
import { Avatar } from '../components/Avatar';
import { Card } from '../components/Card';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, contacts, users, isLoading, error, actions } = useAppStore();
  const { isDark, toggleDarkMode } = useStore();
  const { signOut } = useAuth();
  const [paymentMessage, setPaymentMessage] = useState(currentUser?.paymentMessage || '');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleSavePaymentMessage = async () => {
    if (!currentUser) return;
    
    try {
      await actions.updateCurrentUser({ paymentMessage: paymentMessage.trim() || undefined });
    } catch (err) {
      console.error('Failed to save payment message:', err);
    }
  };

  const handleAddContact = async () => {
    if (!newContactEmail.trim()) return;
    
    try {
      await actions.addContactByEmail(newContactEmail.trim(), newContactName.trim() || undefined);
      setNewContactEmail('');
      setNewContactName('');
      setIsAddingContact(false);
    } catch (err) {
      console.error('Failed to add contact:', err);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    try {
      await actions.removeContact(contactId);
    } catch (err) {
      console.error('Failed to remove contact:', err);
    }
  };

  const handleCancelAddContact = () => {
    setNewContactEmail('');
    setNewContactName('');
    setIsAddingContact(false);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    setIsDeletingAccount(true);
    try {
      await actions.deleteAccount();
      // After successful deletion, sign out and redirect
      await signOut();
      navigate('/welcome');
    } catch (err) {
      console.error('Failed to delete account:', err);
      setIsDeletingAccount(false);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
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
            onClick={() => navigate('/dashboard')}
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

          {/* Contacts Section */}
          <div className="bg-mantle rounded-lg p-4 border border-surface0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">My Contacts</h2>
              <Button
                onClick={() => setIsAddingContact(true)}
                size="sm"
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <UserPlus size={16} />
                Add Contact
              </Button>
            </div>

            <p className="text-xs text-subtext1 mb-3">
              Add people to create individual expenses with them. Group members are automatically available for group expenses.
            </p>

            {/* Add Contact Form */}
            {isAddingContact && (
              <div className="mb-4 p-3 bg-surface0 rounded-lg">
                <div className="space-y-3">
                  <div>
                    <label htmlFor="newContactEmail" className="block text-sm font-medium mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-subtext1" size={16} />
                      <input
                        id="newContactEmail"
                        type="email"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full pl-10 pr-3 py-2 bg-mantle border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="newContactName" className="block text-sm font-medium mb-1">
                      Display Name (Optional)
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-subtext1" size={16} />
                      <input
                        id="newContactName"
                        type="text"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
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
                      onClick={handleAddContact}
                      size="sm"
                      disabled={isLoading || !newContactEmail.trim()}
                      className={!newContactEmail.trim() ? 'opacity-50 cursor-not-allowed' : ''}
                    >
                      {isLoading ? 'Adding...' : 'Add Contact'}
                    </Button>
                    <Button
                      onClick={handleCancelAddContact}
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

            {/* Contacts List */}
            <div className="space-y-2">
              {contacts.length === 0 ? (
                <p className="text-center text-subtext1 py-4">
                  No contacts yet. Add someone to get started!
                </p>
              ) : (
                contacts.map(contact => {
                  // Find the actual user profile for registered contacts
                  const userProfile = contact.contactUserId ? 
                    users.find(u => u.id === contact.contactUserId) : null;
                  
                  const displayUser = userProfile || {
                    id: contact.id,
                    name: contact.contactName,
                    email: contact.contactEmail,
                  };

                  return (
                    <Card key={contact.id} className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar user={displayUser} size="sm" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{contact.contactName}</span>
                            {contact.isInvited && (
                              <span className="px-2 py-1 text-xs bg-yellow/20 text-yellow rounded-full">
                                Invited
                              </span>
                            )}
                          </div>
                          {(contact.contactEmail || userProfile?.email) && (
                            <p className="text-xs text-subtext1">
                              {contact.contactEmail || userProfile?.email}
                            </p>
                          )}
                          {userProfile?.paymentMessage && (
                            <p className="text-xs text-subtext1">{userProfile.paymentMessage}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveContact(contact.id)}
                          className="text-subtext1 hover:text-red transition-colors p-1"
                          disabled={isLoading}
                          title="Remove contact"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </Card>
                  );
                })
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

          {/* Account Section */}
          <div className="bg-mantle rounded-lg p-4 border border-surface0">
            <h2 className="text-lg font-semibold mb-4">Account</h2>
            
            <div className="space-y-3">
              <Button
                onClick={handleSignOut}
                variant="secondary"
                disabled={isSigningOut}
                className="flex items-center gap-2 w-full justify-center"
              >
                <LogOut size={16} />
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Button>

              <Button
                onClick={() => setShowDeleteModal(true)}
                variant="destructive"
                disabled={isLoading}
                className="flex items-center gap-2 w-full justify-center"
              >
                <Trash2 size={16} />
                Delete Account
              </Button>
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

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-mantle rounded-lg p-6 w-full max-w-md border border-surface0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red">Delete Account</h3>
                <p className="text-sm text-subtext1">This action cannot be undone</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-red/10 border border-red/20 rounded-lg p-3">
                <p className="text-sm text-red/90">
                  <strong>Warning:</strong> Deleting your account will permanently remove:
                </p>
                <ul className="text-sm text-red/80 mt-2 space-y-1 list-disc list-inside">
                  <li>Your profile and payment information</li>
                  <li>All expenses you've created</li>
                  <li>Your participation in group expenses</li>
                  <li>All settlement history</li>
                  <li>Your membership in all groups</li>
                  <li>All your contacts</li>
                </ul>
              </div>

              <div>
                <label htmlFor="deleteConfirm" className="block text-sm font-medium mb-2">
                  Type <span className="font-mono bg-surface0 px-1 rounded">DELETE</span> to confirm:
                </label>
                <input
                  id="deleteConfirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3 py-2 bg-base border border-surface0 rounded-lg focus:outline-none focus:ring-2 focus:ring-red focus:border-transparent"
                  disabled={isDeletingAccount}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCloseDeleteModal}
                  variant="secondary"
                  disabled={isDeletingAccount}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  variant="destructive"
                  disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                  className={`flex-1 ${deleteConfirmText !== 'DELETE' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
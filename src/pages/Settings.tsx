import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { useStore } from '../data/store';
import { Button } from '../components/Button';
import { Switch } from '../components/Switch';
import { Avatar } from '../components/Avatar';

export const Settings: React.FC = () => {
  const { currentUser, actions } = useAppStore();
  const { isDark, toggleDarkMode } = useStore();
  const [paymentMessage, setPaymentMessage] = useState(currentUser.paymentMessage || '');

  const handleSavePaymentMessage = () => {
    actions.updateCurrentUser({ paymentMessage: paymentMessage.trim() || undefined });
  };

  const handleBack = () => {
    // Save payment message before leaving if it's different
    if (paymentMessage.trim() !== (currentUser.paymentMessage || '')) {
      handleSavePaymentMessage();
    }
    actions.navigateTo('dashboard');
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
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        <div className="space-y-6">
          {/* User Profile Section */}
          <div className="bg-mantle rounded-lg p-4 border border-surface0">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>
            
            <div className="flex items-center gap-4 mb-4">
              <Avatar user={currentUser} size="lg" />
              <div>
                <h3 className="font-medium text-lg">{currentUser.name}</h3>
                <p className="text-sm text-subtext1">Your profile</p>
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
              />
              <p className="text-xs text-subtext0">
                This will be shown to others when they need to pay you
              </p>
              
              <Button
                onClick={handleSavePaymentMessage}
                size="sm"
                disabled={paymentMessage.trim() === (currentUser.paymentMessage || '')}
                className={paymentMessage.trim() === (currentUser.paymentMessage || '') ? 'opacity-50 cursor-not-allowed' : ''}
              >
                Save Payment Info
              </Button>
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
              <p><span className="font-medium text-text">Version:</span> 1.1.0</p>
              <p><span className="font-medium text-text">Built with:</span> React, TypeScript, Tailwind CSS</p>
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
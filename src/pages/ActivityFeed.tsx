import React from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';

export const ActivityFeed: React.FC = () => {
  const { currentUser, groups, expenses, actions } = useAppStore();
  
  // Get all settlement transactions, sorted by date (newest first)
  const settlementTransactions = expenses
    .filter(expense => expense.isSettlement)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };
  
  const getGroupName = (groupId?: string) => {
    if (!groupId) return 'Individual';
    const group = groups.find(g => g.id === groupId);
    return group?.name || 'Unknown Group';
  };
  
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
          <h1 className="text-xl font-bold">Settlement History</h1>
        </div>
      </div>
      
      <div className="max-w-md mx-auto p-4">
        <div className="space-y-4">
          {settlementTransactions.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-subtext1 mx-auto mb-3" />
                <h3 className="font-semibold mb-2">No settlements yet</h3>
                <p className="text-sm text-subtext1">
                  When you settle up with friends, those payments will appear here.
                </p>
              </div>
            </Card>
          ) : (
            settlementTransactions.map(settlement => {
              const isPayer = settlement.paidBy.id === currentUser.id;
              const otherUser = isPayer 
                ? settlement.participants[0].user 
                : settlement.paidBy;
              
              return (
                <Card key={settlement.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-green w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar user={otherUser} size="sm" />
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium text-text">
                              {isPayer ? 'You' : otherUser.name}
                            </span>
                            {' paid '}
                            <span className="font-medium text-text">
                              {isPayer ? otherUser.name : 'you'}
                            </span>
                            {' '}
                            <span className="font-bold text-green">
                              ${settlement.amount.toFixed(2)}
                            </span>
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-subtext1">
                              {getGroupName(settlement.groupId)}
                            </span>
                            <span className="text-xs text-subtext0">•</span>
                            <span className="text-xs text-subtext0">
                              {formatDate(settlement.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
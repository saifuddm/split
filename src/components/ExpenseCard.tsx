import React, { useState } from 'react';
import { ChevronDown, Pencil, CheckCircle } from 'lucide-react';
import { useAppStore } from '../data/useAppStore';
import { Card } from './Card';
import { Button } from './Button';
import { Avatar } from './Avatar';
import type { Expense } from '../lib/types';

interface ExpenseCardProps {
  expense: Expense;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ expense }) => {
  const { currentUser, actions } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleToggleExpense = () => {
    setIsExpanded(prev => !prev);
  };
  
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
  
  // Handle settlement transactions differently
  if (expense.isSettlement) {
    return (
      <div className="flex items-center gap-4 p-4 bg-surface0 rounded-lg">
        <CheckCircle className="text-green w-5 h-5 flex-shrink-0" />
        <p className="text-sm text-subtext1">
          <span className="font-medium text-text">
            {expense.paidBy.id === currentUser.id ? "You" : expense.paidBy.name}
          </span>{" "}
          paid{" "}
          <span className="font-medium text-text">
            {expense.participants[0].user.id === currentUser.id ? "you" : expense.participants[0].user.name}
          </span>{" "}
          <span className="font-medium text-text">
            ${expense.amount.toFixed(2)}
          </span>
          <span className="block text-xs text-subtext0 mt-1">
            {formatDate(expense.date)}
          </span>
        </p>
      </div>
    );
  }

  // Find current user's participation in this expense
  const currentUserParticipant = expense.participants.find(
    p => p.user.id === currentUser.id
  );
  
  // For non-group expenses, find the other participant
  const otherParticipant = !expense.groupId 
    ? expense.participants.find(p => p.user.id !== currentUser.id)
    : null;
  
  return (
    <Card className="p-0">
      <div
        className="p-4 cursor-pointer"
        onClick={handleToggleExpense}
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
            <p className="text-xs text-subtext0 mt-1">
              {formatDate(expense.date)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">${expense.amount.toFixed(2)}</p>
            {currentUserParticipant ? (
              <p className="text-xs text-subtext1">
                Your share: ${currentUserParticipant.share.toFixed(2)}
              </p>
            ) : (
              <p className="text-xs text-subtext1">
                Not involved in split
              </p>
            )}
          </div>
          <ChevronDown
            size={20}
            className={`ml-2 text-subtext1 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>
      {isExpanded && (
        <>
          <div className="border-t border-surface0 p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-sm">Split Breakdown</h4>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  actions.startEditingExpense(expense.id);
                }}
                className="flex items-center gap-1"
              >
                <Pencil size={14} />
                Edit
              </Button>
            </div>
            <div className="space-y-3">
              {expense.participants.map(({ user, share }) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar user={user} size="sm" />
                    <span className="text-sm">
                      {user.id === currentUser.id ? "You" : user.name}
                    </span>
                  </div>
                  <span className="text-sm font-mono">${share.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* History Section */}
          {expense.history && expense.history.length > 0 && (
            <div className="border-t border-surface0 p-4">
              <h4 className="font-medium text-sm mb-3">History</h4>
              <div className="space-y-4">
                {expense.history.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3 text-xs">
                    <Avatar user={entry.actor} size="xs" />
                    <div className="flex-1">
                      <p className="text-subtext1">
                        <span className="font-medium text-text">
                          {entry.actor.id === currentUser.id ? "You" : entry.actor.name}
                        </span>{" "}
                        {entry.action} on {formatDate(entry.timestamp)}.
                      </p>
                      {entry.details && (
                        <div className="mt-2 p-2 bg-crust rounded-md text-subtext0 whitespace-pre-wrap text-[11px] leading-relaxed font-mono">
                          {entry.details}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
};
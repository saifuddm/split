import React, { useState } from "react";
import { ChevronDown, Pencil, CheckCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "../data/useAppStore";
import { Card } from "./Card";
import { Button } from "./Button";
import { Avatar } from "./Avatar";
import type { Expense } from "../lib/types";

export const ExpenseCard: React.FC<{ expense: Expense }> = ({ expense }) => {
  const { currentUser, actions } = useAppStore();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const isGroupExpense = !!expense.groupId;
  const amountOwedByCurrentUser =
    expense.participants.find((p) => p.user.id === currentUser.id)?.share || 0;

  const handleToggleExpense = () => {
    setIsExpanded((prev) => !prev);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const handleEdit = () => {
    actions.startEditingExpense(expense.id);
    navigate({ to: "/add-expense" });
  };

  return (
    <Card className="hover:bg-surface0 cursor-pointer" onClick={handleEdit}>
      <div className="cursor-pointer p-4" onClick={handleToggleExpense}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-1 font-medium">{expense.description}</h3>
            <div className="text-subtext1 flex items-center gap-2 text-sm">
              <Avatar user={expense.paidBy} size="sm" />
              <span>
                {expense.paidBy.id === currentUser.id
                  ? "You"
                  : expense.paidBy.name}{" "}
                paid
              </span>
            </div>
            <p className="text-subtext0 mt-1 text-xs">
              {formatDate(expense.date)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">${expense.amount.toFixed(2)}</p>
            {isGroupExpense ? (
              <p className="text-subtext1 text-xs">Not involved in split</p>
            ) : (
              <p className="text-subtext1 text-xs">
                Your share: ${amountOwedByCurrentUser.toFixed(2)}
              </p>
            )}
          </div>
          <ChevronDown
            size={20}
            className={`text-subtext1 ml-2 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>
      {isExpanded && (
        <>
          <div className="border-surface0 border-t p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-medium">Split Breakdown</h4>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="flex items-center gap-1"
              >
                <Pencil size={14} />
                Edit
              </Button>
            </div>
            <div className="space-y-3">
              {expense.participants.map(({ user, share }) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar user={user} size="sm" />
                    <span className="text-sm">
                      {user.id === currentUser.id ? "You" : user.name}
                    </span>
                  </div>
                  <span className="font-mono text-sm">${share.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* History Section */}
          {expense.history && expense.history.length > 0 && (
            <div className="border-surface0 border-t p-4">
              <h4 className="mb-3 text-sm font-medium">History</h4>
              <div className="space-y-4">
                {expense.history.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3 text-xs">
                    <Avatar user={entry.actor} size="xs" />
                    <div className="flex-1">
                      <p className="text-subtext1">
                        <span className="text-text font-medium">
                          {entry.actor.id === currentUser.id
                            ? "You"
                            : entry.actor.name}
                        </span>{" "}
                        {entry.action} on {formatDate(entry.timestamp)}.
                      </p>
                      {entry.details && (
                        <div className="bg-crust text-subtext0 mt-2 rounded-md p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
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

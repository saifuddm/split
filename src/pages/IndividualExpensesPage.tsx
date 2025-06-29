import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "../data/useAppStore";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { ExpenseCard } from "../components/ExpenseCard";

export const IndividualExpensesPage: React.FC = () => {
  const { currentUser, users, expenses, actions } = useAppStore();
  const navigate = useNavigate();

  // Get all non-group transactions, sorted by date (newest first)
  const individualTransactions = expenses
    .filter((exp) => !exp.groupId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-base text-text min-h-screen">
      {/* Header */}
      <div className="bg-mantle border-surface0 border-b p-4">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            className="p-2"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-xl font-bold">Individual Expenses</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md p-4">
        {/* All Transactions Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">All Transactions</h2>
          <div className="space-y-3">
            {individualTransactions.length === 0 ? (
              <Card>
                <p className="text-subtext1 text-center">
                  No individual transactions yet
                </p>
              </Card>
            ) : (
              individualTransactions.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

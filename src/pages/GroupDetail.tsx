import React from "react";
import { ArrowLeft, Plus, Handshake } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useAppStore } from "../data/useAppStore";
import { calculateSimplifiedDebts } from "../lib/utils";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import { ExpenseCard } from "../components/ExpenseCard";

export const GroupDetail: React.FC = () => {
  const { groupId } = useParams({ from: "/groups/$groupId" });
  const { currentUser, groups, expenses, actions } = useAppStore();
  const navigate = useNavigate();

  const group = groups.find((g) => g.id === groupId);
  const groupExpenses = expenses.filter((exp) => exp.groupId === groupId);

  if (!group) {
    return (
      <div className="bg-base text-text min-h-screen p-4">
        <div className="mx-auto max-w-md">
          <p>Group not found</p>
          <Button onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const simplifiedDebts = calculateSimplifiedDebts(
    group.members,
    groupExpenses,
  );

  return (
    <div className="bg-base text-text min-h-screen">
      {/* Header */}
      <div className="bg-mantle border-surface0 border-b p-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate({ to: "/dashboard" })}
              className="p-2"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-xl font-bold">{group.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate({ to: "/settle-up" })}
              className="p-2"
            >
              <Handshake size={20} />
            </Button>
            <Button
              size="sm"
              onClick={() => {
                navigate({ to: "/add-expense" });
              }}
              className="p-2"
            >
              <Plus size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md p-4">
        {/* Simplified Debts Section */}
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Who Owes Who</h2>
          <div className="space-y-3">
            {simplifiedDebts.length === 0 ? (
              <Card>
                <p className="text-subtext1 text-center">
                  Everyone is settled up!
                </p>
              </Card>
            ) : (
              simplifiedDebts.map(({ debtor, creditor, amount }, index) => (
                <Card key={index}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar user={debtor} />
                      <span className="font-medium">
                        {debtor.id === currentUser.id ? "You" : debtor.name}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-subtext1 text-sm">owes</span>
                      <span className="text-red font-semibold">
                        ${amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar user={creditor} />
                      <span className="font-medium">
                        {creditor.id === currentUser.id ? "You" : creditor.name}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Expenses Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Expenses</h2>
          <div className="space-y-3">
            {groupExpenses.length === 0 ? (
              <Card>
                <p className="text-subtext1 text-center">No expenses yet</p>
              </Card>
            ) : (
              groupExpenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

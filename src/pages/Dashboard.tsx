import React from "react";
import { Plus, Users, Handshake, Settings, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../data/useAppStore";
import {
  calculateNetBalanceBetweenTwoUsers,
} from "../lib/utils";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";

export const Dashboard: React.FC = () => {
  const { currentUser, users, groups, expenses, actions } = useAppStore();
  const navigate = useNavigate();

  // Early return if currentUser is null
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-base text-text flex items-center justify-center">
        <p>Loading user data...</p>
      </div>
    );
  }

  // Calculate overall balances using the utility function
  const overallBalances: { [userId: string]: number } = {};
  users.forEach(user => {
    if (user.id !== currentUser.id) {
      overallBalances[user.id] = calculateNetBalanceBetweenTwoUsers(
        currentUser,
        user,
        groups,
        expenses,
      );
    }
  });

  // Calculate individual balances (non-group only) for the summary card
  const individualBalances: { [userId: string]: number } = {};
  users.forEach(user => {
    if (user.id !== currentUser.id) {
      individualBalances[user.id] = calculateNetBalanceBetweenTwoUsers(
        currentUser,
        user,
        [], // Pass empty groups array to calculate only individual expenses
        expenses,
      );
    }
  });

  // Calculate net balance for a specific group (for group cards)
  const getGroupBalance = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return 0;

    // Calculate the current user's total balance within this single group
    let balance = 0;
    group.members.forEach(member => {
      if (member.id !== currentUser.id) {
        const groupExpenses = expenses.filter(exp => exp.groupId === groupId);
        // The balance with each member contributes to the total group balance
        balance += calculateNetBalanceBetweenTwoUsers(
          currentUser,
          member,
          [group],
          groupExpenses,
        );
      }
    });

    return balance;
  };

  const handleUserCardClick = (userId: string) => {
    actions.setPreselectedUserForExpense(userId);
    navigate("/add-expense");
  };

  // Get other users for Quick Add (excluding current user)
  const otherUsers = users.filter((user) => user.id !== currentUser.id);

  // Get users with individual balances for the summary
  const usersWithIndividualDebtsToYou = users.filter(
    (user) => user.id !== currentUser.id && individualBalances[user.id] > 0.01,
  );

  const usersYouOweIndividually = users.filter(
    (user) => user.id !== currentUser.id && individualBalances[user.id] < -0.01,
  );

  return (
    <div className="bg-base text-text min-h-screen p-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/activity")}
              variant="secondary"
              size="sm"
              className="p-2"
            >
              <Bell size={16} />
            </Button>
            <Button
              onClick={() => navigate("/settings")}
              variant="secondary"
              size="sm"
              className="p-2"
            >
              <Settings size={16} />
            </Button>
            <Button
              onClick={() => navigate("/create-group")}
              size="sm"
              className="flex items-center gap-2"
            >
              <Users size={16} />
              Create Group
            </Button>
          </div>
        </div>

        {/* Quick Add Section */}
        {otherUsers.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Add Expense with...</h2>
            <div className="flex gap-4 overflow-x-auto py-2">
              {otherUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserCardClick(user.id)}
                  className="hover:bg-surface0 flex flex-shrink-0 cursor-pointer flex-col items-center gap-2 rounded-lg p-2 transition-colors"
                >
                  <Avatar user={user} size="md" />
                  <span className="text-center text-sm font-medium whitespace-nowrap">
                    {user.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Individual Expenses Summary Section */}
        <div className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Individual Expenses</h2>
          <Card
            onClick={() => navigate("/individual-expenses")}
            className="hover:bg-surface0 cursor-pointer transition-colors"
          >
            {usersWithIndividualDebtsToYou.length === 0 &&
            usersYouOweIndividually.length === 0 ? (
              <p className="text-subtext1 text-center">
                All individual expenses are settled.
              </p>
            ) : (
              <div className="space-y-3">
                {usersWithIndividualDebtsToYou.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Who owes you:</h4>
                    <div className="space-y-1">
                      {usersWithIndividualDebtsToYou.map((user) => (
                        <div
                          key={user.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-subtext1">{user.name}</span>
                          <span className="text-green font-medium">
                            +${individualBalances[user.id].toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {usersYouOweIndividually.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">You owe:</h4>
                    <div className="space-y-1">
                      {usersYouOweIndividually.map((user) => (
                        <div
                          key={user.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-subtext1">{user.name}</span>
                          <span className="text-red font-medium">
                            ${Math.abs(individualBalances[user.id]).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-surface0 border-t pt-2">
                  <p className="text-subtext0 text-center text-xs">
                    Tap to view all individual transactions
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Groups Section */}
        <div className="mb-24 pb-24">
          <h2 className="mb-4 text-lg font-semibold">Groups</h2>
          <div className="space-y-3">
            {groups.map((group) => {
              const balance = getGroupBalance(group.id);
              return (
                <Card
                  key={group.id}
                  onClick={() => navigate(`/group/${group.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{group.name}</h3>
                      <p className="text-subtext1 text-sm">
                        {group.members.length} members
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          balance > 0.01
                            ? "text-green"
                            : balance < -0.01
                              ? "text-red"
                              : "text-subtext1"
                        }`}
                      >
                        {balance > 0.01 ? "+" : ""}${balance.toFixed(2)}
                      </p>
                      <p className="text-subtext1 text-xs">
                        {balance > 0.01
                          ? "you are owed"
                          : balance < -0.01
                            ? "you owe"
                            : "settled up"}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div className="fixed right-6 bottom-6 flex flex-col gap-3">
          {/* Settle Up Button */}
          <Button
            onClick={() => navigate("/settle-up")}
            className="bg-green hover:bg-teal h-14 w-14 rounded-full shadow-lg"
          >
            <Handshake size={24} />
          </Button>

          {/* Add Expense Button */}
          <Button
            onClick={() => navigate("/add-expense")}
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <Plus size={24} />
          </Button>
        </div>
      </div>
    </div>
  );
};
import {
  Await,
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { Button } from "../components/Button";
import { BellIcon, LogOutIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { Avatar } from "../components/Avatar";
import React from "react";
import type {
  DbExpense,
  DbExpenseMember,
  DbGroup,
  DbUser,
} from "../supabaseClient";
import { Card } from "../components/Card";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  loader: async ({ context }) => {
    console.log(
      "Loading dashboard",
      context.auth.contacts,
      context.auth.groups,
      context.auth.expenses,
    );

    // Handle contacts
    const contactsPromise = context.auth.contacts
      ? Promise.resolve(context.auth.contacts)
      : context.auth.actions.getContactsForUser(context.auth.user?.id!);

    // Handle groups
    const groupsPromise =
      context.auth.groups && context.auth.groups.length > 0
        ? Promise.resolve(context.auth.groups)
        : context.auth.actions.getGroupsForUser(context.auth.user?.id!);

    // Handle expenses
    const expensesPromise =
      context.auth.expenses && context.auth.expenses.length > 0
        ? Promise.resolve(context.auth.expenses)
        : context.auth.actions.getExpensesForUser(context.auth.user?.id!);

    return {
      contacts: contactsPromise,
      groups: groupsPromise,
      expenses: expensesPromise,
    };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { contacts, groups, expenses } = Route.useLoaderData();

  return (
    <div className="bg-base text-text min-h-screen p-4">
      <Header />
      <Await promise={contacts} fallback={<QuickAddSectionSkeleton />}>
        {(data) => <QuickAddSection contacts={data} />}
      </Await>
      <Await promise={expenses} fallback={<div>Loading...</div>}>
        {(data) => <IndivisualExpenseSection expenses={data} />}
      </Await>
      <Await promise={groups} fallback={<GroupSectionSkeleton />}>
        {(data) => <GroupSection groups={data} />}
      </Await>
    </div>
  );
}

function Header() {
  const router = useRouter();
  const { actions, isAuthenticated } = Route.useRouteContext({
    select: ({ auth }) => ({
      actions: auth.actions,
      isAuthenticated: auth.isAuthenticated,
    }),
  });

  async function handleSignOut() {
    await actions.signOut();
    router.invalidate();
  }

  React.useEffect(() => {
    if (!isAuthenticated) {
      router.navigate({ to: "/login" });
    }
  }, [isAuthenticated]);

  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="flex items-center gap-2">
        <Link to="/activity">
          <Button variant="secondary" size="sm" className="p-2">
            <BellIcon size={16} />
          </Button>
        </Link>
        <Link to="/settings">
          <Button variant="secondary" size="sm" className="p-2">
            <SettingsIcon size={16} />
          </Button>
        </Link>
        <Link to="/create/group">
          <Button size="sm" className="flex items-center gap-2">
            <UsersIcon size={16} />
            Create Group
          </Button>
        </Link>
        <Button
          variant="destructive"
          size="sm"
          className="p-2"
          onClick={handleSignOut}
        >
          <LogOutIcon size={16} />
        </Button>
      </div>
    </div>
  );
}

function QuickAddSection({ contacts }: { contacts: DbUser[] }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Add Expense with...</h2>
      {contacts.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto py-2">
          {contacts.map((user) => (
            <Link
              to="/create/expense"
              search={{ user_id: user.id }}
              key={user.id}
            >
              <div className="hover:bg-surface0 flex flex-shrink-0 cursor-pointer flex-col items-center gap-2 rounded-lg p-2 transition-colors">
                <Avatar user={user} size="md" />
                <span className="text-center text-sm font-medium whitespace-nowrap">
                  {user.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-surface0 border-overlay0 rounded-lg border p-4 text-center">
          <p className="text-subtext1 mb-2">No contacts yet</p>
          <p className="text-subtext0 mb-3 text-sm">
            Add contacts to quickly create expenses with them
          </p>
          <Link to="/settings">
            <Button size="sm">Go to Settings</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

interface GroupSectionProps {
  groups: {
    details: DbGroup;
    members: DbUser[];
  }[];
}
function GroupSection({ groups }: GroupSectionProps) {
  const router = useRouter();
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Groups</h2>
      {groups.length > 0 ? (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card
              key={group.details.id}
              onClick={() =>
                router.navigate({
                  to: "/group/$groupId",
                  params: { groupId: group.details.id.toString() },
                })
              }
            >
              <h3 className="text-lg font-semibold">{group.details.name}</h3>
              <p className="text-subtext1 text-sm">
                {group.members.length} members
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-surface0 border-overlay0 rounded-lg border p-4 text-center">
          <p className="text-subtext1 mb-2">No groups yet</p>
          <p className="text-subtext0 mb-3 text-sm">
            Create a group to start splitting expenses with friends
          </p>
          <Link to="/create/group">
            <Button size="sm">Create Group</Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function QuickAddSectionSkeleton() {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Add Expense with...</h2>
      <div className="flex gap-4 overflow-x-auto py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-shrink-0 flex-col items-center gap-2 rounded-lg p-2"
          >
            <div className="bg-surface0 h-12 w-12 animate-pulse rounded-full" />
            <div className="bg-surface0 h-4 w-16 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupSectionSkeleton() {
  return (
    <div className="mb-24 pb-24">
      <h2 className="mb-4 text-lg font-semibold">Groups</h2>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface0 border-overlay0 animate-pulse rounded-lg border p-4"
          >
            <div className="bg-surface1 mb-2 h-6 w-32 rounded" />
            <div className="bg-surface1 h-4 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface IndivisualExpenseSectionProps {
  expenses: {
    details: DbExpense;
    members: DbExpenseMember[];
  }[];
}
function IndivisualExpenseSection({ expenses }: IndivisualExpenseSectionProps) {
  // Displays expenses that do not belong to any group

  const router = useRouter();
  const { user: currentUser, contacts } = Route.useRouteContext({
    select: ({ auth }) => ({
      user: auth.user,
      contacts: auth.contacts,
    }),
  });

  const individualExpenses = expenses.filter(
    (expense) => expense.details.group_id === null,
  );

  // Helper function to get user details by ID
  const getUserById = (userId: number): DbUser | null => {
    if (currentUser?.id === userId) return currentUser;
    return contacts?.find((contact) => contact.id === userId) || null;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  if (individualExpenses.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Individual Expenses</h2>
        <div className="bg-surface0 border-overlay0 rounded-lg border p-4 text-center">
          <p className="text-subtext1 mb-2">No individual expenses yet</p>
          <p className="text-subtext0 mb-3 text-sm">
            Create direct expenses with your contacts
          </p>
          <Link to="/create/expense">
            <Button size="sm">Add Expense</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Individual Expenses</h2>
      <div className="space-y-3">
        {individualExpenses.slice(0, 5).map((expense) => {
          const paidByUser = getUserById(expense.details.user_paid);
          const totalMembers = expense.members.length;
          const userShare =
            expense.members.find((m) => m.user_id === currentUser?.id)
              ?.amount_share || 0;
          const isPaidByCurrentUser =
            expense.details.user_paid === currentUser?.id;

          return (
            <Card
              key={expense.details.id}
              className="hover:bg-surface0 cursor-pointer"
              onClick={() => {
                // Navigate to expense details (you can implement this route later)
                console.log("Navigate to expense:", expense.details.id);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {expense.members.slice(0, 3).map((member) => {
                        const user = getUserById(member.user_id);
                        return user ? (
                          <Avatar
                            key={member.user_id}
                            user={user}
                            size="sm"
                            className="border-base border-2"
                          />
                        ) : (
                          <div
                            key={member.user_id}
                            className="bg-surface1 border-base flex h-8 w-8 items-center justify-center rounded-full border-2"
                          >
                            <span className="text-subtext1 text-xs">?</span>
                          </div>
                        );
                      })}
                      {totalMembers > 3 && (
                        <div className="bg-surface1 border-base flex h-8 w-8 items-center justify-center rounded-full border-2">
                          <span className="text-subtext1 text-xs">
                            +{totalMembers - 3}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold">
                        {expense.details.description}
                      </h3>
                      <p className="text-subtext1 text-sm">
                        {paidByUser
                          ? isPaidByCurrentUser
                            ? "You paid"
                            : `${paidByUser.name} paid`
                          : "Unknown user paid"}{" "}
                        • {formatDate(expense.details.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold">
                    ${expense.details.amount.toFixed(2)}
                  </p>
                  <p
                    className={`text-sm ${
                      isPaidByCurrentUser
                        ? userShare < expense.details.amount
                          ? "text-green"
                          : "text-subtext1"
                        : "text-red"
                    }`}
                  >
                    {isPaidByCurrentUser
                      ? userShare < expense.details.amount
                        ? `you get $${(expense.details.amount - userShare).toFixed(2)}`
                        : `you paid`
                      : `you owe $${userShare.toFixed(2)}`}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}

        {individualExpenses.length > 5 && (
          <div className="pt-2 text-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                // TODO: Navigate to individual expenses page when route is created
                console.log("Show all individual expenses");
              }}
            >
              View All {individualExpenses.length} Expenses
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

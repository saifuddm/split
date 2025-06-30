import {
  Await,
  createFileRoute,
  Link,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { Button } from "../components/Button";
import { BellIcon, LogOutIcon, SettingsIcon, UsersIcon } from "lucide-react";
import { useAppStore } from "../data/useAppStore";
import type { User } from "../lib/types";
import { Avatar } from "../components/Avatar";
import React from "react";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  loader: async () => {
    const { currentUser, actions } = useAppStore.getState();
    const contactUserIds = currentUser.contacts || [];
    const contacts = actions.getUsersById(contactUserIds);
    // const groupExpenses = actions.getGroupExpenses();
    // const individualExpenses = actions.getIndividualExpenses();
    return { currentUser, contacts };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { currentUser, contacts } = Route.useLoaderData();

  return (
    <div className="bg-base text-text min-h-screen p-4">
      <Header />
      <Await promise={contacts} fallback={<div>Loading...</div>}>
        {(data) => <QuickAddSection contacts={data} />}
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

function QuickAddSection({ contacts }: { contacts: User[] }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 text-lg font-semibold">Add Expense with...</h2>
      <div className="flex gap-4 overflow-x-auto py-2">
        {contacts.map((user) => (
          <Link to="/create/expense" params={{ userId: user.id }}>
            <div
              key={user.id}
              className="hover:bg-surface0 flex flex-shrink-0 cursor-pointer flex-col items-center gap-2 rounded-lg p-2 transition-colors"
            >
              <Avatar user={user} size="md" />
              <span className="text-center text-sm font-medium whitespace-nowrap">
                {user.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

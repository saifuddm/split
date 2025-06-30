import { Await, createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "../../components/Button";
import { ArrowLeft } from "lucide-react";
import type { DbUser } from "../../supabaseClient";
import { useState } from "react";
import { Avatar } from "../../components/Avatar";
import { useAuthStore } from "../../data/useAuthStore";

export const Route = createFileRoute("/create/group")({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
      });
    }
  },
  loader: async ({ context }) => {
    if (context.auth.contacts) {
      return {
        contacts: Promise.resolve(context.auth.contacts),
      };
    }
    const contactDetails = context.auth.actions.getContactsForUser(
      context.auth.user?.id!,
    );
    return {
      contacts: contactDetails,
    };
  },
  component: CreateGroupPage,
});

function CreateGroupPage() {
  const { contacts } = Route.useLoaderData();
  return (
    <div className="bg-base text-text min-h-screen">
      <Header />
      <Await promise={contacts} fallback={<div>Loading...</div>}>
        {(contacts) => <GroupForm contacts={contacts} />}
      </Await>
    </div>
  );
}

function Header() {
  const navigate = Route.useNavigate();
  return (
    <div className="bg-mantle border-surface0 border-b p-4">
      <div className="mx-auto flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate({ to: "/dashboard" })}
          className="p-2"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-xl font-bold">Create a New Group</h1>
      </div>
    </div>
  );
}

function GroupForm({ contacts }: { contacts: DbUser[] }) {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<DbUser[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");

  const navigate = Route.useNavigate();
  const { actions } = Route.useRouteContext({
    select: ({ auth }) => ({
      actions: auth.actions,
    }),
  });

  const handleMemberToggle = (user: DbUser) => {
    setSelectedMembers((prev) => {
      const isSelected = prev.some((member) => member.id === user.id);
      if (isSelected) {
        return prev.filter((member) => member.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;

    setIsCreating(true);
    setError("");

    try {
      const result = await actions.createGroup(
        groupName.trim(),
        selectedMembers,
      );

      if (result.error) {
        setError(result.error);
      } else {
        // Success! Navigate to dashboard
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Error creating group:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const isFormValid = groupName.trim() && selectedMembers.length > 0;

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="space-y-6">
        {/* Group Name */}
        <div>
          <label htmlFor="groupName" className="mb-2 block text-sm font-medium">
            Group Name
          </label>
          <input
            id="groupName"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="e.g., Ski Trip"
            className="bg-mantle border-surface0 focus:ring-blue w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:outline-none"
          />
        </div>

        {/* Members Selection */}
        <div>
          <label className="mb-2 block text-sm font-medium">Members</label>
          <p className="text-subtext1 mb-3 text-xs">
            You are automatically included in the group
          </p>

          <div className="space-y-2">
            {contacts.map((user) => (
              <label
                key={user.id}
                className="bg-mantle border-surface0 hover:bg-surface0 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.some(
                    (member) => member.id === user.id,
                  )}
                  onChange={() => handleMemberToggle(user)}
                  className="text-blue focus:ring-blue"
                />
                <Avatar user={user} size="sm" />
                <span className="font-medium">{user.name}</span>
              </label>
            ))}
          </div>

          {selectedMembers.length > 0 && (
            <p className="text-subtext1 mt-2 text-sm">
              {selectedMembers.length + 1} members selected (including you)
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red/10 border-red text-red rounded-lg border p-3 text-sm">
            {error}
          </div>
        )}

        {/* Create Button */}
        <div className="pt-4">
          <Button
            onClick={handleCreateGroup}
            disabled={!isFormValid || isCreating}
            className={`w-full ${!isFormValid || isCreating ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {isCreating ? "Creating Group..." : "Create Group"}
          </Button>
        </div>
      </div>
    </div>
  );
}

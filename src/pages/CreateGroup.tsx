import React, { useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "../data/useAppStore";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";
import type { User } from "../lib/types";

export const CreateGroup: React.FC = () => {
  const { currentUser, users, activeGroupId, actions } = useAppStore();
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);

  // Get all users except the current user
  const availableUsers = users.filter((user) => user.id !== currentUser.id);

  const handleMemberToggle = (user: User) => {
    setSelectedMembers((prev) => {
      const isSelected = prev.some((member) => member.id === user.id);
      if (isSelected) {
        return prev.filter((member) => member.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedMembers.length > 0) {
      actions.createGroup(groupName.trim(), selectedMembers);
      // Use setTimeout to allow the store to update before navigation
      setTimeout(() => {
        const state = useAppStore.getState();
        if (state.activeGroupId) {
          navigate({
            to: "/groups/$groupId",
            params: { groupId: state.activeGroupId },
          });
        }
      }, 0);
    }
  };

  const isFormValid = groupName.trim() && selectedMembers.length > 0;

  const navigate = useNavigate();

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
          <h1 className="text-xl font-bold">Create Group</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md p-4">
        <div className="space-y-6">
          {/* Group Name */}
          <div>
            <label
              htmlFor="groupName"
              className="mb-2 block text-sm font-medium"
            >
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
              {availableUsers.map((user) => (
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

          {/* Create Button */}
          <div className="pt-4">
            <Button
              onClick={handleCreateGroup}
              disabled={!isFormValid}
              className={`w-full ${!isFormValid ? "cursor-not-allowed opacity-50" : ""}`}
            >
              Create Group
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

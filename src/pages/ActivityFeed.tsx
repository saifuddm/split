import React from "react";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "../data/useAppStore";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Avatar } from "../components/Avatar";

export const ActivityFeed: React.FC = () => {
  const { currentUser, groups, expenses } = useAppStore();
  const navigate = useNavigate();

  // Get all activities (expenses only, settlements are separate)
  const allActivities = expenses.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

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

  const getGroupName = (groupId?: string) => {
    if (!groupId) return "Individual";
    const group = groups.find((g) => g.id === groupId);
    return group?.name || "Unknown Group";
  };

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
          <h1 className="text-xl font-bold">Settlement History</h1>
        </div>
      </div>

      <div className="mx-auto max-w-md p-4">
        <div className="space-y-4">
          {allActivities.length === 0 ? (
            <Card>
              <div className="py-8 text-center">
                <CheckCircle className="text-subtext1 mx-auto mb-3 h-12 w-12" />
                <h3 className="mb-2 font-semibold">No settlements yet</h3>
                <p className="text-subtext1 text-sm">
                  When you settle up with friends, those payments will appear
                  here.
                </p>
              </div>
            </Card>
          ) : (
            allActivities.map((activity) => {
              const isPayer = activity.paidBy.id === currentUser.id;
              const otherUser = isPayer
                ? activity.participants[0].user
                : activity.paidBy;

              return (
                <Card key={activity.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="text-green mt-0.5 h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Avatar user={otherUser} size="sm" />
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="text-text font-medium">
                              {isPayer ? "You" : otherUser.name}
                            </span>
                            {" paid "}
                            <span className="text-text font-medium">
                              {isPayer ? otherUser.name : "you"}
                            </span>{" "}
                            <span className="text-green font-bold">
                              ${activity.amount.toFixed(2)}
                            </span>
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-subtext1 text-xs">
                              {getGroupName(activity.groupId)}
                            </span>
                            <span className="text-subtext0 text-xs">•</span>
                            <span className="text-subtext0 text-xs">
                              {formatDate(activity.date)}
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

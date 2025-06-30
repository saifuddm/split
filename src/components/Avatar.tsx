import React from "react";
import type { DbUser } from "../supabaseClient";

interface AvatarProps {
  user: DbUser;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getBackgroundColor = (name: string) => {
    const colors = [
      "bg-blue",
      "bg-green",
      "bg-peach",
      "bg-pink",
      "bg-mauve",
      "bg-teal",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} ${getBackgroundColor(user.name)} flex items-center justify-center rounded-full text-base font-medium ${className}`}
    >
      {getInitials(user.name)}
    </div>
  );
};

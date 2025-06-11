import React from 'react';
import type { User } from '../lib/types';

interface AvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getBackgroundColor = (name: string) => {
    const colors = ['bg-blue', 'bg-green', 'bg-peach', 'bg-pink', 'bg-mauve', 'bg-teal'];
    const index = name.length % colors.length;
    return colors[index];
  };
  
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover`}
      />
    );
  }
  
  return (
    <div
      className={`${sizeClasses[size]} ${getBackgroundColor(user.name)} rounded-full flex items-center justify-center text-base font-medium`}
    >
      {getInitials(user.name)}
    </div>
  );
};
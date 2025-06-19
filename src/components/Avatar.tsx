import React from 'react';
import type { User } from '../lib/types';

interface AvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ user, size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };
  
  const getInitials = (name: string) => {
    const safeName = name || 'Unknown User';
    return safeName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  const getBackgroundColor = (name: string) => {
    const safeName = name || 'Unknown User';
    const colors = ['bg-blue', 'bg-green', 'bg-peach', 'bg-pink', 'bg-mauve', 'bg-teal'];
    const index = safeName.length % colors.length;
    return colors[index];
  };
  
  const safeName = user.name || 'Unknown User';
  
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={safeName}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }
  
  return (
    <div
      className={`${sizeClasses[size]} ${getBackgroundColor(safeName)} rounded-full flex items-center justify-center text-base font-medium ${className}`}
    >
      {getInitials(safeName)}
    </div>
  );
};
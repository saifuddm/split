
export interface User {
  id: string;
  name: string;
  avatarUrl?: string; // Optional avatar image URL
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidBy: User;
  participants: { user: User; share: number }[];
  date: string; // ISO 8601 format
}

export interface Group {
  id: string;
  name: string;
  members: User[];
}
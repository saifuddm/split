// src/lib/mockData.ts
import type { User, Group, Expense } from "./types";

export const currentUser: User = { id: "user-1", name: "You" };

export const users: User[] = [
  currentUser,
  { id: "user-2", name: "Alice", avatarUrl: "https://i.pravatar.cc/48?u=2" },
  { id: "user-3", name: "Bob", avatarUrl: "https://i.pravatar.cc/48?u=3" },
  { id: "user-4", name: "Charlie", avatarUrl: "https://i.pravatar.cc/48?u=4" },
];

export const groups: Group[] = [
  {
    id: "group-1",
    name: "Trip to Bali",
    members: [users[0], users[1], users[2]],
  },
  {
    id: "group-2",
    name: "Apartment Utilities",
    members: [users[0], users[3]],
  },
];

export const expenses: Expense[] = [
  {
    id: "exp-1",
    groupId: "group-1",
    description: "Flight Tickets",
    amount: 900,
    paidBy: users[1], // Alice paid
    participants: [
      { user: users[0], share: 300 },
      { user: users[1], share: 300 },
      { user: users[2], share: 300 },
    ],
    date: "2025-06-05T10:00:00Z",
  },
  {
    id: "exp-2",
    groupId: "group-1",
    description: "Dinner",
    amount: 150,
    paidBy: users[0], // You paid
    participants: [
      { user: users[0], share: 50 },
      { user: users[1], share: 50 },
      { user: users[2], share: 50 },
    ],
    date: "2025-06-06T19:30:00Z",
  },
  {
    id: "exp-3",
    groupId: "group-2",
    description: "Internet Bill",
    amount: 60,
    paidBy: users[3], // Charlie paid
    participants: [
      { user: users[0], share: 30 },
      { user: users[3], share: 30 },
    ],
    date: "2025-06-10T12:00:00Z",
  },
];
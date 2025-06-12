// src/lib/mockData.ts
import type { User, Group, Expense } from "./types";

export const currentUser: User = { id: "user-1", name: "You" };

export const users: User[] = [
  currentUser,
  { 
    id: "user-2", 
    name: "Alice", 
    avatarUrl: "https://i.pravatar.cc/48?u=2",
    paymentMessage: "Venmo: @alice-in-chains",
  },
  { id: "user-3", name: "Bob", avatarUrl: "https://i.pravatar.cc/48?u=3" },
  { 
    id: "user-4", 
    name: "Charlie", 
    avatarUrl: "https://i.pravatar.cc/48?u=4",
    paymentMessage: "CashApp: $char-lie",
  },
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
  // Group expenses
  {
    id: "exp-1",
    groupId: "group-1",
    description: "Flight Tickets",
    amount: 900,
    paidBy: users[1], // Alice paid
    participants: [
      { user: users[0], share: 300 }, // You owe 300
      { user: users[1], share: 300 }, // Alice paid 300 for herself
      { user: users[2], share: 300 }, // Bob owes 300
    ],
    date: "2025-01-05T10:00:00Z",
    history: [
      {
        actor: users[1], // Alice
        action: "created this expense",
        timestamp: "2025-01-05T10:00:00Z",
      },
    ],
  },
  {
    id: "exp-2",
    groupId: "group-1",
    description: "Dinner",
    amount: 150,
    paidBy: users[0], // You paid
    participants: [
      { user: users[0], share: 50 }, // You paid 50 for yourself
      { user: users[1], share: 50 }, // Alice owes 50
      { user: users[2], share: 50 }, // Bob owes 50
    ],
    date: "2025-01-06T19:30:00Z",
    history: [
      {
        actor: users[0], // You
        action: "created this expense",
        timestamp: "2025-01-06T19:30:00Z",
      },
    ],
  },
  {
    id: "exp-3",
    groupId: "group-2",
    description: "Internet Bill",
    amount: 60,
    paidBy: users[3], // Charlie paid
    participants: [
      { user: users[0], share: 30 }, // You owe 30
      { user: users[3], share: 30 }, // Charlie paid 30 for himself
    ],
    date: "2025-01-10T12:00:00Z",
    history: [
      {
        actor: users[3], // Charlie
        action: "created this expense",
        timestamp: "2025-01-10T12:00:00Z",
      },
    ],
  },
  
  // Individual (non-group) expenses
  {
    id: "exp-4",
    description: "Coffee",
    amount: 12,
    paidBy: users[1], // Alice paid
    participants: [
      { user: users[0], share: 6 }, // You owe 6
      { user: users[1], share: 6 }, // Alice paid 6 for herself
    ],
    date: "2025-01-12T14:30:00Z",
    history: [
      {
        actor: users[1], // Alice
        action: "created this expense",
        timestamp: "2025-01-12T14:30:00Z",
      },
    ],
  },
  {
    id: "exp-5",
    description: "Lunch",
    amount: 24,
    paidBy: users[0], // You paid
    participants: [
      { user: users[0], share: 12 }, // You paid 12 for yourself
      { user: users[3], share: 12 }, // Charlie owes 12
    ],
    date: "2025-01-13T12:00:00Z",
    history: [
      {
        actor: users[0], // You
        action: "created this expense",
        timestamp: "2025-01-13T12:00:00Z",
      },
    ],
  },
  {
    id: "exp-6",
    description: "Movie Tickets",
    amount: 30,
    paidBy: users[2], // Bob paid
    participants: [
      { user: users[0], share: 15 }, // You owe 15
      { user: users[2], share: 15 }, // Bob paid 15 for himself
    ],
    date: "2025-01-14T20:00:00Z",
    history: [
      {
        actor: users[2], // Bob
        action: "created this expense",
        timestamp: "2025-01-14T20:00:00Z",
      },
    ],
  },
  
  // Settlement transactions
  {
    id: "settlement-1",
    isSettlement: true,
    description: "Payment to Alice",
    amount: 50,
    paidBy: users[0], // You paid Alice
    participants: [{ user: users[1], share: 50 }], // Alice received
    date: "2025-01-15T16:00:00Z",
    history: [
      {
        actor: users[0],
        action: "paid Alice $50.00",
        timestamp: "2025-01-15T16:00:00Z",
      },
    ],
  },
];
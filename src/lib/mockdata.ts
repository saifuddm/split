// src/lib/mockData.ts
import type { User, Group, Expense, IndividualExpense, Settlement, GroupExpense, ContactList } from "./types";

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

// Contact list for current user - only Alice and Charlie are contacts
export const currentUserContacts: ContactList = {
  userId: currentUser.id,
  contacts: [users[1], users[3]], // Alice and Charlie only
};

export const groups: Group[] = [
  {
    id: "group-1",
    name: "Trip to Bali",
    members: [users[0], users[1], users[2]], // You, Alice, Bob (Bob not in contacts but in group)
  },
  {
    id: "group-2",
    name: "Apartment Utilities",
    members: [users[0], users[3]], // You and Charlie
  },
];

// Group expenses (can include non-contacts if they're in the group)
const groupExpenses: GroupExpense[] = [
  {
    id: "exp-1",
    groupId: "group-1",
    description: "Flight Tickets",
    amount: 900,
    paidBy: users[1], // Alice paid
    participants: [
      { user: users[0], share: 300 }, // You owe 300
      { user: users[1], share: 300 }, // Alice paid 300 for herself
      { user: users[2], share: 300 }, // Bob owes 300 (not in contacts but in group)
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
  {
    id: "exp-6",
    groupId: "group-1",
    description: "Dance Club",
    amount: 240,
    paidBy: users[2], // Bob paid
    participants: [
      { user: users[0], share: 80 }, // You owe 80
      { user: users[2], share: 80 }, // Bob paid 80 for himself
      { user: users[1], share: 80 }, // Alice owes 80
    ],
    date: "2025-01-11T12:00:00Z",
    history: [
      {
        actor: users[2], // Bob
        action: "created this expense",
        timestamp: "2025-01-11T12:00:00Z",
      },
    ],
  }
];

// Individual expenses (only with contacts: Alice and Charlie)
const individualExpenses: IndividualExpense[] = [
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
    id: "exp-7",
    description: "Movie Tickets",
    amount: 30,
    paidBy: users[0], // You paid
    participants: [
      { user: users[0], share: 15 }, // You paid 15 for yourself
      { user: users[1], share: 15 }, // Alice owes 15
    ],
    date: "2025-01-14T20:00:00Z",
    history: [
      {
        actor: users[0], // You
        action: "created this expense",
        timestamp: "2025-01-14T20:00:00Z",
      },
    ],
  },
];

// Settlements (separate from expenses) - can be with anyone you owe money to
export const settlements: Settlement[] = [
  {
    id: "settlement-1",
    description: "Payment for coffee",
    amount: 6,
    paidBy: users[0], // You paid Alice
    paidTo: users[1], // Alice received
    date: "2025-01-15T16:00:00Z",
    history: [
      {
        actor: users[0],
        action: "paid Alice $6.00 for coffee",
        timestamp: "2025-01-15T16:00:00Z",
      },
    ],
  },
  {
    id: "settlement-2",
    groupId: "group-1", // Group settlement
    description: "Payment for Dance Club",
    amount: 80,
    paidBy: users[0], // You paid Bob
    paidTo: users[2], // Bob received (not in contacts but you owe him from group expense)
    date: "2025-01-16T10:00:00Z",
    history: [
      {
        actor: users[0],
        action: "paid Bob $80.00 for Dance Club",
        timestamp: "2025-01-16T10:00:00Z",
      },
    ],
  },
];

// Expenses only (no settlements)
export const expenses: Expense[] = [
  ...groupExpenses,
  ...individualExpenses,
];

// Helper functions to get user by id
export const getUserById = (id: string): User | undefined => {
  return users.find(user => user.id === id);
};

// Helper function to get group by id
export const getGroupById = (id: string): Group | undefined => {
  return groups.find(group => group.id === id);
};

// Helper function to check if a user is in current user's contacts
export const isUserInContacts = (userId: string): boolean => {
  return currentUserContacts.contacts.some(contact => contact.id === userId);
};

// Helper function to get shared groups between current user and another user
export const getSharedGroups = (userId: string): Group[] => {
  return groups.filter(group =>
    group.members.some(member => member.id === currentUser.id) &&
    group.members.some(member => member.id === userId)
  );
};
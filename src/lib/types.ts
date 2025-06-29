export interface User {
  id: string;
  name: string;
  avatarUrl?: string; // Optional avatar image URL
  paymentMessage?: string; // Add this: e.g., "Venmo: @alice-smith"
}

export interface AuditEntry {
  actor: User;
  action: string; // e.g., "created", "updated the amount", "changed the description"
  timestamp: string; // ISO 8601 format
  details?: string; // e.g., "from $50.00 to $60.00"
}

// Regular expense (no settlements)
export interface Expense {
  id: string;
  groupId?: string; // Optional for individual expenses
  description: string;
  amount: number;
  paidBy: User;
  participants: { user: User; share: number }[];
  date: string; // This is the date of the transaction itself
  history?: AuditEntry[]; // The new audit trail
}

// Settlement is completely separate from expenses
export interface Settlement {
  id: string;
  groupId?: string; // Optional - can be for group or individual settlements
  description: string;
  amount: number;
  paidBy: User; // Who made the payment
  paidTo: User; // Who received the payment
  date: string;
  history?: AuditEntry[];
}

// More specific types for better type safety
export interface IndividualExpense extends Omit<Expense, 'groupId'> {
  groupId?: never; // Explicitly exclude groupId for individual expenses
}

export interface GroupExpense extends Expense {
  groupId: string; // Required for group expenses
}

export interface Group {
  id: string;
  name: string;
  members: User[];
}

// Contact management
export interface ContactList {
  userId: string; // The user who owns this contact list
  contacts: User[]; // Users they can directly create expenses with
}

export type SplitMethod = "equally" | "exact" | "percentage";

// Helper type to get all possible expense types
export type AnyExpense = IndividualExpense | GroupExpense;
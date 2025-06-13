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

export interface Expense {
  id: string;
  groupId?: string; // Made optional for non-group expenses
  description: string;
  amount: number;
  paidBy: User;
  participants: { user: User; share: number }[];
  date: string; // This is the date of the transaction itself
  history?: AuditEntry[]; // The new audit trail
  isSettlement?: boolean; // Add this flag
}

// More specific types for better type safety
export interface IndividualExpense extends Omit<Expense, 'groupId' | 'isSettlement'> {
  groupId?: never; // Explicitly exclude groupId for individual expenses
  isSettlement?: false;
}

export interface Settlement extends Omit<Expense, 'groupId' | 'participants'> {
  groupId?: string; // Settlements can be for groups or individuals
  isSettlement: true;
  participants: [{ user: User; share: number }]; // Settlements always have exactly one recipient
}

export interface GroupExpense extends Omit<Expense, 'isSettlement'> {
  groupId: string; // Required for group expenses
  isSettlement?: false;
}

export interface Group {
  id: string;
  name: string;
  members: User[];
}

export type SplitMethod = "equally" | "exact" | "percentage";

// Helper type to get all possible expense types
export type AnyExpense = IndividualExpense | Settlement | GroupExpense;
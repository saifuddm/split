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
  groupId: string;
  description: string;
  amount: number;
  paidBy: User;
  participants: { user: User; share: number }[];
  date: string; // This is the date of the transaction itself
  history?: AuditEntry[]; // The new audit trail
  isSettlement?: boolean; // Add this flag
}

export interface Group {
  id: string;
  name: string;
  members: User[];
}

export type SplitMethod = "equally" | "exact" | "percentage";
import { create } from "zustand";
import {
  currentUser as initialCurrentUser,
  groups as initialGroups,
  expenses as initialExpenses,
  users as initialUsers,
} from "../lib/mockdata";
import { generateAuditDetails } from "../lib/utils";
import type { Group, Expense, User, AuditEntry } from "../lib/types";

type Page = "dashboard" | "group-details" | "add-expense" | "create-group" | "settle-up" | "settings" | "activity";

interface AppState {
  currentPage: Page;
  activeGroupId: string | null;
  editingExpenseId: string | null;
  hasEnteredApp: boolean;
  preselectedUserIdForExpense: string | null;
  currentUser: User;
  users: User[];
  groups: Group[];
  expenses: Expense[];
  actions: {
    navigateTo: (page: Page, groupId?: string) => void;
    enterApp: () => void;
    addExpense: (newExpense: Omit<Expense, "id" | "history">) => void;
    createGroup: (groupName: string, members: User[]) => void;
    startEditingExpense: (expenseId: string) => void;
    updateExpense: (
      expenseId: string,
      updatedExpenseData: Omit<Expense, "id" | "history">,
    ) => void;
    clearEditingExpense: () => void;
    recordSettlement: (
      payee: User,
      settlements: { groupId: string; amount: number }[],
    ) => void;
    setPreselectedUserForExpense: (userId: string | null) => void;
    updateCurrentUser: (updatedData: Partial<User>) => void;
    addUser: (name: string) => void;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: "dashboard",
  activeGroupId: null,
  editingExpenseId: null,
  hasEnteredApp: false,
  preselectedUserIdForExpense: null,
  currentUser: initialCurrentUser,
  users: initialUsers,
  groups: initialGroups,
  expenses: initialExpenses,
  actions: {
    navigateTo: (page, groupId) =>
      set({ currentPage: page, activeGroupId: groupId || null }),
    enterApp: () => set({ hasEnteredApp: true }),
    addExpense: (newExpenseData) => {
      const newExpense: Expense = {
        ...newExpenseData,
        id: `exp-${Date.now()}`,
        history: [
          {
            actor: get().currentUser,
            action: "created this expense",
            timestamp: new Date().toISOString(),
          },
        ],
      };
      set((state) => ({
        expenses: [...state.expenses, newExpense],
      }));
    },
    createGroup: (groupName, members) => {
      const newGroup: Group = {
        id: `group-${Date.now()}`,
        name: groupName,
        // Ensure the current user is always included
        members: [get().currentUser, ...members],
      };
      set((state) => ({
        groups: [...state.groups, newGroup],
      }));
      // Navigate to the new group's page after creation
      get().actions.navigateTo("group-details", newGroup.id);
    },
    startEditingExpense: (expenseId) => {
      set({ editingExpenseId: expenseId });
      get().actions.navigateTo("add-expense", get().activeGroupId || undefined);
    },
    updateExpense: (expenseId, updatedData) => {
      const originalExpense = get().expenses.find(e => e.id === expenseId);
      if (!originalExpense) return;

      // Generate the detailed action and details object
      const auditInfo = generateAuditDetails(originalExpense, updatedData);

      const newHistoryEntry: AuditEntry = {
        actor: get().currentUser,
        action: auditInfo.action,
        details: auditInfo.details, // Assign the new details string
        timestamp: new Date().toISOString(),
      };

      const updatedExpense: Expense = {
        ...originalExpense,
        ...updatedData,
        history: [...(originalExpense.history || []), newHistoryEntry],
      };

      set((state) => ({
        expenses: state.expenses.map(e =>
          e.id === expenseId ? updatedExpense : e,
        ),
        editingExpenseId: null,
      }));
    },
    clearEditingExpense: () => {
      set({ editingExpenseId: null });
    },
    recordSettlement: (payee, settlements) => {
      const settlementExpenses: Expense[] = settlements.map(
        ({ groupId, amount }) => {
          const baseSettlement = {
            id: `settlement-${Date.now()}-${Math.random()}`,
            isSettlement: true,
            description: `Payment to ${payee.name}`,
            amount,
            paidBy: get().currentUser, // You are the one paying
            // The payee is the sole participant, "owing" the full amount back to you.
            // This creates a negative debt for them, effectively cancelling your positive debt.
            participants: [{ user: payee, share: amount }],
            date: new Date().toISOString(),
            history: [
              {
                actor: get().currentUser,
                action: `paid ${payee.name} $${amount.toFixed(2)}`,
                timestamp: new Date().toISOString(),
              },
            ],
          };

          // Only include groupId if it's not empty (for group settlements)
          if (groupId) {
            return { ...baseSettlement, groupId };
          }
          
          // For individual settlements, don't include groupId
          return baseSettlement;
        }
      );

      set(state => ({
        expenses: [...state.expenses, ...settlementExpenses]
      }));
    },
    setPreselectedUserForExpense: (userId) => {
      set({ preselectedUserIdForExpense: userId });
    },
    updateCurrentUser: (updatedData) => {
      set(state => ({
        currentUser: { ...state.currentUser, ...updatedData }
      }));
    },
    addUser: (name) => {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        avatarUrl: `https://i.pravatar.cc/48?u=${Date.now()}`,
      };
      set(state => ({
        users: [...state.users, newUser]
      }));
    },
  },
}));
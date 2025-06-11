import { create } from "zustand";
import {
  currentUser,
  groups as initialGroups,
  expenses as initialExpenses,
} from "../lib/mockdata";
import { generateAuditDetails } from "../lib/utils";
import type { Group, Expense, User, AuditEntry } from "../lib/types";

type Page = "dashboard" | "group-details" | "add-expense" | "create-group";

interface AppState {
  currentPage: Page;
  activeGroupId: string | null;
  editingExpenseId: string | null;
  groups: Group[];
  expenses: Expense[];
  actions: {
    navigateTo: (page: Page, groupId?: string) => void;
    addExpense: (newExpense: Omit<Expense, "id" | "history">) => void;
    createGroup: (groupName: string, members: User[]) => void;
    startEditingExpense: (expenseId: string) => void;
    updateExpense: (
      expenseId: string,
      updatedExpenseData: Omit<Expense, "id" | "history">,
    ) => void;
    clearEditingExpense: () => void;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: "dashboard",
  activeGroupId: null,
  editingExpenseId: null,
  groups: initialGroups,
  expenses: initialExpenses,
  actions: {
    navigateTo: (page, groupId = null) =>
      set({ currentPage: page, activeGroupId: groupId }),
    addExpense: (newExpenseData) => {
      const newExpense: Expense = {
        ...newExpenseData,
        id: `exp-${Date.now()}`,
        history: [
          {
            actor: currentUser,
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
        members: [currentUser, ...members],
      };
      set((state) => ({
        groups: [...state.groups, newGroup],
      }));
      // Navigate to the new group's page after creation
      get().actions.navigateTo("group-details", newGroup.id);
    },
    startEditingExpense: (expenseId) => {
      set({ editingExpenseId: expenseId });
      get().actions.navigateTo("add-expense", get().activeGroupId);
    },
    updateExpense: (expenseId, updatedData) => {
      const originalExpense = get().expenses.find(e => e.id === expenseId);
      if (!originalExpense) return;

      // Generate the detailed action and details object
      const auditInfo = generateAuditDetails(originalExpense, updatedData);

      const newHistoryEntry: AuditEntry = {
        actor: currentUser,
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
  },
}));
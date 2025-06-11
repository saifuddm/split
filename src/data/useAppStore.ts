import { create } from "zustand";
import {
  currentUser,
  groups as initialGroups,
  expenses as initialExpenses,
} from "../lib/mockdata";
import type { Group, Expense, User } from "../lib/types";

type Page = "dashboard" | "group-details" | "add-expense";

interface AppState {
  currentPage: Page;
  activeGroupId: string | null;
  groups: Group[];
  expenses: Expense[];
  actions: {
    navigateTo: (page: Page, groupId?: string) => void;
    addExpense: (newExpense: Omit<Expense, "id">) => void;
  };
}

export const useAppStore = create<AppState>((set) => ({
  currentPage: "dashboard",
  activeGroupId: null,
  groups: initialGroups,
  expenses: initialExpenses,
  actions: {
    navigateTo: (page, groupId = null) =>
      set({ currentPage: page, activeGroupId: groupId }),
    addExpense: (newExpense) =>
      set((state) => ({
        expenses: [
          ...state.expenses,
          { ...newExpense, id: `exp-${Date.now()}` },
        ],
      })),
  },
}));
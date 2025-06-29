import { create } from "zustand";
import {
  currentUser as initialCurrentUser,
  groups as initialGroups,
  expenses as initialExpenses,
  users as initialUsers,
  settlements as initialSettlements,
} from "../lib/mockdata";
import { generateAuditDetails } from "../lib/utils";
import type { Group, Expense, User, AuditEntry, Settlement } from "../lib/types";

type Page = "dashboard" | "group-details" | "add-expense" | "create-group" | "settle-up" | "settings" | "activity" | "individual-expenses";

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
  settlements: Settlement[];
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
    recordSettlementReverse: (
      payer: User,
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
  settlements: initialSettlements,
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
        activeGroupId: newGroup.id, // Set the new group as active for navigation
      }));
    },
    startEditingExpense: (expenseId) => {
      set({ editingExpenseId: expenseId });
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
    recordSettlement: (payee, settlementAmounts) => {
      const newSettlements: Settlement[] = settlementAmounts.map(
        ({ groupId, amount }) => ({
          id: `settlement-${Date.now()}-${Math.random()}`,
          groupId: groupId || undefined,
          description: `Payment to ${payee.name}`,
          amount,
          paidBy: get().currentUser,
          paidTo: payee,
          date: new Date().toISOString(),
          history: [
            {
              actor: get().currentUser,
              action: `paid ${payee.name} $${amount.toFixed(2)}`,
              timestamp: new Date().toISOString(),
            },
          ],
        })
      );

      set(state => ({
        settlements: [...state.settlements, ...newSettlements]
      }));
    },
    recordSettlementReverse: (payer, settlementAmounts) => {
      const newSettlements: Settlement[] = settlementAmounts.map(
        ({ groupId, amount }) => ({
          id: `settlement-${Date.now()}-${Math.random()}`,
          groupId: groupId || undefined,
          description: `Payment from ${payer.name}`,
          amount,
          paidBy: payer,
          paidTo: get().currentUser,
          date: new Date().toISOString(),
          history: [
            {
              actor: get().currentUser,
              action: `received $${amount.toFixed(2)} from ${payer.name}`,
              timestamp: new Date().toISOString(),
            },
          ],
        })
      );

      set(state => ({
        settlements: [...state.settlements, ...newSettlements]
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
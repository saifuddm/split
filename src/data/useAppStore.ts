import { create } from "zustand";
import { 
  getCurrentUserProfile,
  getAllProfiles,
  getAllGroups,
  getAllExpenses,
  updateUserProfile,
  inviteUserByEmail,
  createGroup as createGroupAPI,
  addExpense as addExpenseAPI,
  updateExpense as updateExpenseAPI,
  recordSettlement as recordSettlementAPI,
  recordSettlementReverse as recordSettlementReverseAPI,
} from "../lib/supabaseQueries";
import { generateAuditDetails } from "../lib/utils";
import type { Group, Expense, User } from "../lib/types";

interface AppState {
  editingExpenseId: string | null;
  preselectedUserIdForExpense: string | null;
  currentUser: User | null;
  users: User[];
  groups: Group[];
  expenses: Expense[];
  loading: boolean;
  actions: {
    loadInitialData: () => Promise<void>;
    addExpense: (newExpense: Omit<Expense, "id" | "history">) => Promise<void>;
    createGroup: (groupName: string, members: User[]) => Promise<void>;
    startEditingExpense: (expenseId: string) => void;
    updateExpense: (
      expenseId: string,
      updatedExpenseData: Omit<Expense, "id" | "history">,
    ) => Promise<void>;
    clearEditingExpense: () => void;
    recordSettlement: (
      payee: User,
      settlements: { groupId: string; amount: number }[],
    ) => Promise<void>;
    recordSettlementReverse: (
      payer: User,
      settlements: { groupId: string; amount: number }[],
    ) => Promise<void>;
    setPreselectedUserForExpense: (userId: string | null) => void;
    updateCurrentUser: (updatedData: Partial<User>) => Promise<void>;
    inviteUser: (email: string, name?: string) => Promise<void>;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  editingExpenseId: null,
  preselectedUserIdForExpense: null,
  currentUser: null,
  users: [],
  groups: [],
  expenses: [],
  loading: false,
  actions: {
    loadInitialData: async () => {
      set({ loading: true });
      try {
        const [currentUser, users, groups, expenses] = await Promise.all([
          getCurrentUserProfile(),
          getAllProfiles(),
          getAllGroups(),
          getAllExpenses(),
        ]);

        set({
          currentUser,
          users,
          groups,
          expenses,
          loading: false,
        });
      } catch (error) {
        console.error('Error loading initial data:', error);
        set({ loading: false });
      }
    },

    addExpense: async (newExpenseData) => {
      const { currentUser } = get();
      if (!currentUser?.email) return;

      try {
        const success = await addExpenseAPI({
          description: newExpenseData.description,
          amount: newExpenseData.amount,
          paidByEmail: newExpenseData.paidBy.email || currentUser.email,
          groupId: newExpenseData.groupId,
          participants: newExpenseData.participants.map(p => ({
            email: p.user.email || currentUser.email,
            share: p.share,
          })),
          isSettlement: newExpenseData.isSettlement,
          transactionDate: newExpenseData.date,
        });

        if (success) {
          // Reload data to get the latest state
          await get().actions.loadInitialData();
        }
      } catch (error) {
        console.error('Error adding expense:', error);
      }
    },

    createGroup: async (groupName, members) => {
      const { currentUser } = get();
      if (!currentUser?.email) return;

      try {
        // Get member emails, filtering out any without emails
        const memberEmails = members
          .map(m => m.email)
          .filter((email): email is string => Boolean(email));

        const groupId = await createGroupAPI(groupName, memberEmails);
        
        if (groupId) {
          // Reload data to get the latest state
          await get().actions.loadInitialData();
        }
      } catch (error) {
        console.error('Error creating group:', error);
      }
    },

    startEditingExpense: (expenseId) => {
      set({ editingExpenseId: expenseId });
    },

    updateExpense: async (expenseId, updatedData) => {
      const { currentUser, expenses } = get();
      if (!currentUser?.email) return;

      try {
        const originalExpense = expenses.find(e => e.id === expenseId);
        if (!originalExpense) return;

        // Generate audit information
        const auditInfo = generateAuditDetails(originalExpense, updatedData);

        const success = await updateExpenseAPI(
          expenseId,
          {
            description: updatedData.description,
            amount: updatedData.amount,
            paidByEmail: updatedData.paidBy.email || currentUser.email,
            groupId: updatedData.groupId,
            participants: updatedData.participants.map(p => ({
              email: p.user.email || currentUser.email,
              share: p.share,
            })),
            transactionDate: updatedData.date,
          },
          auditInfo
        );

        if (success) {
          set({ editingExpenseId: null });
          // Reload data to get the latest state
          await get().actions.loadInitialData();
        }
      } catch (error) {
        console.error('Error updating expense:', error);
      }
    },

    clearEditingExpense: () => {
      set({ editingExpenseId: null });
    },

    recordSettlement: async (payee, settlements) => {
      if (!payee.email) return;

      try {
        const success = await recordSettlementAPI(payee.email, settlements);
        
        if (success) {
          // Reload data to get the latest state
          await get().actions.loadInitialData();
        }
      } catch (error) {
        console.error('Error recording settlement:', error);
      }
    },

    recordSettlementReverse: async (payer, settlements) => {
      if (!payer.email) return;

      try {
        const success = await recordSettlementReverseAPI(payer.email, settlements);
        
        if (success) {
          // Reload data to get the latest state
          await get().actions.loadInitialData();
        }
      } catch (error) {
        console.error('Error recording reverse settlement:', error);
      }
    },

    setPreselectedUserForExpense: (userId) => {
      set({ preselectedUserIdForExpense: userId });
    },

    updateCurrentUser: async (updatedData) => {
      try {
        const success = await updateUserProfile(updatedData);
        
        if (success) {
          // Update local state
          set(state => ({
            currentUser: state.currentUser ? { ...state.currentUser, ...updatedData } : null
          }));
          
          // Reload data to ensure consistency
          await get().actions.loadInitialData();
        }
      } catch (error) {
        console.error('Error updating user profile:', error);
      }
    },

    inviteUser: async (email, name) => {
      try {
        const success = await inviteUserByEmail(email, name);
        
        if (success) {
          // Reload data to get the latest state including the new invited user
          await get().actions.loadInitialData();
        }
      } catch (error) {
        console.error('Error inviting user:', error);
      }
    },
  },
}));
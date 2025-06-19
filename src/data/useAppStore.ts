import { create } from "zustand";
import { generateAuditDetails } from "../lib/utils";
import * as supabaseQueries from "../lib/supabaseQueries";
import type { Group, Expense, User, AuditEntry } from "../lib/types";

interface AppState {
  // Data state
  currentUser: User | null;
  users: User[];
  groups: Group[];
  expenses: Expense[];
  
  // UI state
  editingExpenseId: string | null;
  preselectedUserIdForExpense: string | null;
  isLoading: boolean;
  error: string | null;
  
  actions: {
    // Data loading
    loadInitialData: () => Promise<void>;
    
    // User management
    updateCurrentUser: (updatedData: Partial<User>) => Promise<void>;
    inviteUserByEmail: (email: string, fullName?: string) => Promise<void>;
    
    // Group management
    createGroup: (groupName: string, memberEmails: string[]) => Promise<void>;
    
    // Expense management
    addExpense: (newExpense: Omit<Expense, "id" | "history">) => Promise<void>;
    startEditingExpense: (expenseId: string) => void;
    updateExpense: (
      expenseId: string,
      updatedExpenseData: Omit<Expense, "id" | "history">,
    ) => Promise<void>;
    clearEditingExpense: () => void;
    
    // Settlement management
    recordSettlement: (
      payee: User,
      settlements: { groupId: string; amount: number }[],
    ) => Promise<void>;
    recordSettlementReverse: (
      payer: User,
      settlements: { groupId: string; amount: number }[],
    ) => Promise<void>;
    
    // UI state management
    setPreselectedUserForExpense: (userId: string | null) => void;
    clearError: () => void;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentUser: null,
  users: [],
  groups: [],
  expenses: [],
  editingExpenseId: null,
  preselectedUserIdForExpense: null,
  isLoading: false,
  error: null,

  actions: {
    loadInitialData: async () => {
      try {
        set({ isLoading: true, error: null });
        
        // Load all data in parallel
        const [currentUser, allUsers, groups, expenses] = await Promise.all([
          supabaseQueries.getCurrentUserProfile(),
          supabaseQueries.getAllProfiles(),
          supabaseQueries.getUserGroups(),
          supabaseQueries.getUserExpenses(),
        ]);

        set({
          currentUser,
          users: allUsers,
          groups,
          expenses,
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to load initial data:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load data',
          isLoading: false 
        });
      }
    },

    updateCurrentUser: async (updatedData) => {
      try {
        set({ isLoading: true, error: null });
        
        await supabaseQueries.updateCurrentUserProfile(updatedData);
        
        // Reload data to get fresh state
        await get().actions.loadInitialData();
      } catch (error) {
        console.error('Failed to update user:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update profile',
          isLoading: false 
        });
      }
    },

    inviteUserByEmail: async (email, fullName) => {
      try {
        set({ isLoading: true, error: null });
        
        await supabaseQueries.inviteUserByEmail(email, fullName);
        
        // Reload data to include the new invited user
        await get().actions.loadInitialData();
      } catch (error) {
        console.error('Failed to invite user:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to invite user',
          isLoading: false 
        });
      }
    },

    createGroup: async (groupName, memberEmails) => {
      try {
        set({ isLoading: true, error: null });
        
        await supabaseQueries.createGroup(groupName, memberEmails);
        
        // Reload data to include the new group
        await get().actions.loadInitialData();
      } catch (error) {
        console.error('Failed to create group:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create group',
          isLoading: false 
        });
      }
    },

    addExpense: async (newExpenseData) => {
      try {
        set({ isLoading: true, error: null });
        
        await supabaseQueries.addExpense(newExpenseData);
        
        // Reload data to include the new expense
        await get().actions.loadInitialData();
      } catch (error) {
        console.error('Failed to add expense:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to add expense',
          isLoading: false 
        });
      }
    },

    startEditingExpense: (expenseId) => {
      set({ editingExpenseId: expenseId });
    },

    updateExpense: async (expenseId, updatedData) => {
      try {
        set({ isLoading: true, error: null });
        
        const originalExpense = get().expenses.find(e => e.id === expenseId);
        if (!originalExpense) {
          throw new Error('Expense not found');
        }

        // Generate audit details
        const auditInfo = generateAuditDetails(originalExpense, updatedData);
        
        await supabaseQueries.updateExpense(
          expenseId, 
          updatedData, 
          auditInfo.action, 
          auditInfo.details
        );
        
        // Clear editing state and reload data
        set({ editingExpenseId: null });
        await get().actions.loadInitialData();
      } catch (error) {
        console.error('Failed to update expense:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update expense',
          isLoading: false 
        });
      }
    },

    clearEditingExpense: () => {
      set({ editingExpenseId: null });
    },

    recordSettlement: async (payee, settlements) => {
      try {
        set({ isLoading: true, error: null });
        
        await supabaseQueries.recordSettlement(payee, settlements);
        
        // Reload data to include the settlement
        await get().actions.loadInitialData();
      } catch (error) {
        console.error('Failed to record settlement:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to record settlement',
          isLoading: false 
        });
      }
    },

    recordSettlementReverse: async (payer, settlements) => {
      try {
        set({ isLoading: true, error: null });
        
        await supabaseQueries.recordSettlementReverse(payer, settlements);
        
        // Reload data to include the settlement
        await get().actions.loadInitialData();
      } catch (error) {
        console.error('Failed to record settlement:', error);
        set({ 
          error: error instanceof Error ? error.message : 'Failed to record settlement',
          isLoading: false 
        });
      }
    },

    setPreselectedUserForExpense: (userId) => {
      set({ preselectedUserIdForExpense: userId });
    },

    clearError: () => {
      set({ error: null });
    },
  },
}));
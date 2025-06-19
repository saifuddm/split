import { supabase } from './supabaseClient';
import type { User, Group, Expense, AuditEntry } from './types';

// Type definitions for database rows
interface ProfileRow {
  id: string | null;
  full_name: string | null;
  avatar_url: string | null;
  payment_message: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

interface GroupRow {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  group_members: {
    user_id: string;
    joined_at: string;
    profiles: ProfileRow;
  }[];
}

interface ExpenseRow {
  id: string;
  description: string;
  amount: number;
  paid_by_id: string;
  group_id: string | null;
  is_settlement: boolean;
  transaction_date: string;
  created_at: string;
  profiles: ProfileRow; // The payer
  expense_participants: {
    user_id: string;
    share: number;
    profiles: ProfileRow;
  }[];
  expense_history: {
    id: number;
    actor_id: string;
    action: string;
    details: string | null;
    created_at: string;
    profiles: ProfileRow;
  }[];
}

// Helper function to convert ProfileRow to User
const profileRowToUser = (profile: ProfileRow): User => ({
  id: profile.id || `invited-${profile.email}`, // Use email-based ID for invited users
  name: profile.full_name || profile.email?.split('@')[0] || 'Unknown User',
  avatarUrl: profile.avatar_url || undefined,
  paymentMessage: profile.payment_message || undefined,
  email: profile.email || undefined,
  isInvited: profile.id === null, // Flag to identify invited users
});

// Helper function to convert ExpenseRow to Expense
const expenseRowToExpense = (expense: ExpenseRow): Expense => ({
  id: expense.id,
  description: expense.description,
  amount: expense.amount,
  paidBy: profileRowToUser(expense.profiles),
  groupId: expense.group_id || undefined,
  participants: expense.expense_participants.map(ep => ({
    user: profileRowToUser(ep.profiles),
    share: ep.share,
  })),
  date: expense.transaction_date,
  isSettlement: expense.is_settlement,
  history: expense.expense_history.map(eh => ({
    actor: profileRowToUser(eh.profiles),
    action: eh.action,
    details: eh.details || undefined,
    timestamp: eh.created_at,
  })),
});

// Get current user's profile
export const getCurrentUserProfile = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error || !profile) return null;

  return profileRowToUser(profile);
};

// Get all profiles (users) that the current user can see
export const getAllProfiles = async (): Promise<User[]> => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');

  if (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }

  return profiles.map(profileRowToUser);
};

// Get all groups for the current user
export const getAllGroups = async (): Promise<Group[]> => {
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        user_id,
        joined_at,
        profiles (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }

  return groups.map((group: GroupRow) => ({
    id: group.id,
    name: group.name,
    members: group.group_members.map(gm => profileRowToUser(gm.profiles)),
  }));
};

// Get all expenses for the current user
export const getAllExpenses = async (): Promise<Expense[]> => {
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select(`
      *,
      profiles!expenses_paid_by_id_fkey (*),
      expense_participants (
        user_id,
        share,
        profiles (*)
      ),
      expense_history (
        id,
        actor_id,
        action,
        details,
        created_at,
        profiles (*)
      )
    `)
    .order('transaction_date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }

  return expenses.map(expenseRowToExpense);
};

// Update current user's profile
export const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.name,
      avatar_url: updates.avatarUrl,
      payment_message: updates.paymentMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating profile:', error);
    return false;
  }

  return true;
};

// Invite a user by email (create placeholder profile)
export const inviteUserByEmail = async (email: string, name?: string): Promise<boolean> => {
  // Check if user already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single();

  if (existingProfile) {
    console.log('User already exists');
    return true; // User already exists, consider it successful
  }

  // Create placeholder profile
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: null, // Placeholder profile
      email: email,
      full_name: name || email.split('@')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error inviting user:', error);
    return false;
  }

  return true;
};

// Create a new group
export const createGroup = async (name: string, memberEmails: string[]): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Start a transaction
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name,
      created_by: user.id,
    })
    .select()
    .single();

  if (groupError || !group) {
    console.error('Error creating group:', groupError);
    return null;
  }

  // Get all member profiles (including invited ones)
  const { data: memberProfiles, error: membersError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', [user.email!, ...memberEmails]);

  if (membersError) {
    console.error('Error fetching member profiles:', membersError);
    return null;
  }

  // Create group memberships
  const memberships = memberProfiles
    .filter(profile => profile.id) // Only add users who have signed up
    .map(profile => ({
      group_id: group.id,
      user_id: profile.id,
    }));

  if (memberships.length > 0) {
    const { error: membershipError } = await supabase
      .from('group_members')
      .insert(memberships);

    if (membershipError) {
      console.error('Error adding group members:', membershipError);
      return null;
    }
  }

  return group.id;
};

// Add an expense
export const addExpense = async (expenseData: {
  description: string;
  amount: number;
  paidByEmail: string;
  groupId?: string;
  participants: { email: string; share: number }[];
  isSettlement?: boolean;
  transactionDate?: string;
}): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Get payer profile
  const { data: payerProfile, error: payerError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', expenseData.paidByEmail)
    .single();

  if (payerError || !payerProfile?.id) {
    console.error('Error finding payer:', payerError);
    return false;
  }

  // Create the expense
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      description: expenseData.description,
      amount: expenseData.amount,
      paid_by_id: payerProfile.id,
      group_id: expenseData.groupId || null,
      is_settlement: expenseData.isSettlement || false,
      transaction_date: expenseData.transactionDate || new Date().toISOString(),
    })
    .select()
    .single();

  if (expenseError || !expense) {
    console.error('Error creating expense:', expenseError);
    return false;
  }

  // Get participant profiles
  const participantEmails = expenseData.participants.map(p => p.email);
  const { data: participantProfiles, error: participantsError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', participantEmails);

  if (participantsError) {
    console.error('Error fetching participants:', participantsError);
    return false;
  }

  // Create participant records
  const participantRecords = expenseData.participants
    .map(p => {
      const profile = participantProfiles.find(pp => pp.email === p.email);
      if (!profile?.id) return null;
      return {
        expense_id: expense.id,
        user_id: profile.id,
        share: p.share,
      };
    })
    .filter(Boolean);

  if (participantRecords.length > 0) {
    const { error: participantsInsertError } = await supabase
      .from('expense_participants')
      .insert(participantRecords);

    if (participantsInsertError) {
      console.error('Error adding participants:', participantsInsertError);
      return false;
    }
  }

  // Add history entry
  const { error: historyError } = await supabase
    .from('expense_history')
    .insert({
      expense_id: expense.id,
      actor_id: user.id,
      action: expenseData.isSettlement ? 
        `paid ${expenseData.participants[0]?.email} $${expenseData.amount.toFixed(2)}` :
        'created this expense',
    });

  if (historyError) {
    console.error('Error adding history:', historyError);
  }

  return true;
};

// Update an expense
export const updateExpense = async (
  expenseId: string,
  expenseData: {
    description: string;
    amount: number;
    paidByEmail: string;
    groupId?: string;
    participants: { email: string; share: number }[];
    transactionDate?: string;
  },
  auditInfo: { action: string; details?: string }
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Get payer profile
  const { data: payerProfile, error: payerError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', expenseData.paidByEmail)
    .single();

  if (payerError || !payerProfile?.id) {
    console.error('Error finding payer:', payerError);
    return false;
  }

  // Update the expense
  const { error: expenseError } = await supabase
    .from('expenses')
    .update({
      description: expenseData.description,
      amount: expenseData.amount,
      paid_by_id: payerProfile.id,
      group_id: expenseData.groupId || null,
      transaction_date: expenseData.transactionDate || new Date().toISOString(),
    })
    .eq('id', expenseId);

  if (expenseError) {
    console.error('Error updating expense:', expenseError);
    return false;
  }

  // Delete existing participants
  const { error: deleteParticipantsError } = await supabase
    .from('expense_participants')
    .delete()
    .eq('expense_id', expenseId);

  if (deleteParticipantsError) {
    console.error('Error deleting participants:', deleteParticipantsError);
    return false;
  }

  // Get new participant profiles
  const participantEmails = expenseData.participants.map(p => p.email);
  const { data: participantProfiles, error: participantsError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', participantEmails);

  if (participantsError) {
    console.error('Error fetching participants:', participantsError);
    return false;
  }

  // Create new participant records
  const participantRecords = expenseData.participants
    .map(p => {
      const profile = participantProfiles.find(pp => pp.email === p.email);
      if (!profile?.id) return null;
      return {
        expense_id: expenseId,
        user_id: profile.id,
        share: p.share,
      };
    })
    .filter(Boolean);

  if (participantRecords.length > 0) {
    const { error: participantsInsertError } = await supabase
      .from('expense_participants')
      .insert(participantRecords);

    if (participantsInsertError) {
      console.error('Error adding participants:', participantsInsertError);
      return false;
    }
  }

  // Add history entry
  const { error: historyError } = await supabase
    .from('expense_history')
    .insert({
      expense_id: expenseId,
      actor_id: user.id,
      action: auditInfo.action,
      details: auditInfo.details,
    });

  if (historyError) {
    console.error('Error adding history:', historyError);
  }

  return true;
};

// Record settlement
export const recordSettlement = async (
  payeeEmail: string,
  settlements: { groupId: string; amount: number }[]
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Get payee profile
  const { data: payeeProfile, error: payeeError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', payeeEmail)
    .single();

  if (payeeError || !payeeProfile?.id) {
    console.error('Error finding payee:', payeeError);
    return false;
  }

  // Create settlement expenses
  for (const settlement of settlements) {
    const success = await addExpense({
      description: `Payment to ${payeeProfile.full_name || payeeEmail}`,
      amount: settlement.amount,
      paidByEmail: user.email!,
      groupId: settlement.groupId || undefined,
      participants: [{ email: payeeEmail, share: settlement.amount }],
      isSettlement: true,
    });

    if (!success) {
      console.error('Error creating settlement:', settlement);
      return false;
    }
  }

  return true;
};

// Record reverse settlement (when someone pays you)
export const recordSettlementReverse = async (
  payerEmail: string,
  settlements: { groupId: string; amount: number }[]
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  // Get payer profile
  const { data: payerProfile, error: payerError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', payerEmail)
    .single();

  if (payerError || !payerProfile?.id) {
    console.error('Error finding payer:', payerError);
    return false;
  }

  // Create settlement expenses
  for (const settlement of settlements) {
    const success = await addExpense({
      description: `Payment from ${payerProfile.full_name || payerEmail}`,
      amount: settlement.amount,
      paidByEmail: payerEmail,
      groupId: settlement.groupId || undefined,
      participants: [{ email: user.email!, share: settlement.amount }],
      isSettlement: true,
    });

    if (!success) {
      console.error('Error creating reverse settlement:', settlement);
      return false;
    }
  }

  return true;
};
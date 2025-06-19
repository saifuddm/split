import { supabase } from './supabaseClient';
import type { User, Group, Expense, AuditEntry } from './types';

// Helper function to get current user ID
const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  return user.id;
};

// Transform database profile to User type
const transformProfile = (profile: any): User => ({
  id: profile.id,
  name: profile.full_name || 'Unknown User',
  email: profile.email,
  avatarUrl: profile.avatar_url,
  paymentMessage: profile.payment_message,
});

// Transform invited user to User type (with special ID format)
const transformInvitedUser = (invitedUser: any): User => ({
  id: `invited_${invitedUser.id}`, // Special prefix to identify invited users
  name: invitedUser.full_name || invitedUser.email.split('@')[0],
  email: invitedUser.email,
  avatarUrl: undefined,
  paymentMessage: undefined,
  isInvited: true,
});

// Get all profiles (both registered and invited users)
export const getAllProfiles = async (): Promise<User[]> => {
  // Get registered users
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');

  if (profilesError) throw profilesError;

  // Get invited users
  const { data: invitedUsers, error: invitedError } = await supabase
    .from('invited_users')
    .select('*');

  if (invitedError) throw invitedError;

  const registeredUsers = (profiles || []).map(transformProfile);
  const pendingUsers = (invitedUsers || []).map(transformInvitedUser);

  return [...registeredUsers, ...pendingUsers];
};

// Get current user profile
export const getCurrentUserProfile = async (): Promise<User> => {
  const userId = await getCurrentUserId();
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return transformProfile(profile);
};

// Update current user profile
export const updateCurrentUserProfile = async (updates: Partial<User>): Promise<void> => {
  const userId = await getCurrentUserId();
  
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.name,
      avatar_url: updates.avatarUrl,
      payment_message: updates.paymentMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
};

// Delete current user account
export const deleteCurrentUserAccount = async (): Promise<void> => {
  const userId = await getCurrentUserId();
  
  // Delete the user's auth account (this will cascade to delete profile and related data)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) throw error;
};

// Invite user by email
export const inviteUserByEmail = async (email: string, fullName?: string): Promise<void> => {
  const userId = await getCurrentUserId();
  
  const { error } = await supabase
    .from('invited_users')
    .insert({
      email: email.toLowerCase().trim(),
      full_name: fullName?.trim(),
      invited_by: userId,
    });

  if (error) throw error;
};

// Get all groups for current user
export const getUserGroups = async (): Promise<Group[]> => {
  const userId = await getCurrentUserId();
  
  const { data: groupMemberships, error } = await supabase
    .from('group_members')
    .select(`
      group_id,
      groups!inner (
        id,
        name,
        created_by,
        created_at
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;

  // Get all unique group IDs
  const groupIds = groupMemberships?.map(gm => gm.group_id) || [];
  
  if (groupIds.length === 0) return [];

  // Get all members for these groups
  const { data: allMemberships, error: membersError } = await supabase
    .from('group_members')
    .select(`
      group_id,
      user_id,
      joined_at
    `)
    .in('group_id', groupIds);

  if (membersError) throw membersError;

  // Get all user profiles and invited users
  const allUsers = await getAllProfiles();
  const userMap = new Map(allUsers.map(user => [user.id, user]));

  // Build groups with members
  const groups: Group[] = [];
  const processedGroups = new Set();

  for (const membership of groupMemberships || []) {
    const groupId = membership.group_id;
    
    if (processedGroups.has(groupId)) continue;
    processedGroups.add(groupId);

    const groupMembers = (allMemberships || [])
      .filter(m => m.group_id === groupId)
      .map(m => {
        // Handle both regular users and invited users
        const userId = m.user_id;
        return userMap.get(userId);
      })
      .filter(Boolean) as User[];

    groups.push({
      id: groupId,
      name: (membership as any).groups.name,
      members: groupMembers,
    });
  }

  return groups;
};

// Create a new group
export const createGroup = async (name: string, memberEmails: string[]): Promise<string> => {
  const userId = await getCurrentUserId();
  
  // Create the group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: name.trim(),
      created_by: userId,
    })
    .select('id')
    .single();

  if (groupError) throw groupError;

  const groupId = group.id;

  // Get all users (registered and invited)
  const allUsers = await getAllProfiles();
  const usersByEmail = new Map(allUsers.map(user => [user.email, user]));

  // Prepare member insertions
  const memberInserts = [];

  // Add creator
  memberInserts.push({
    group_id: groupId,
    user_id: userId,
  });

  // Add other members
  for (const email of memberEmails) {
    const user = usersByEmail.get(email.toLowerCase().trim());
    if (user) {
      // Extract the actual user ID (remove invited_ prefix if present)
      const actualUserId = user.id.startsWith('invited_') ? user.id.replace('invited_', '') : user.id;
      memberInserts.push({
        group_id: groupId,
        user_id: actualUserId,
      });
    }
  }

  // Insert all memberships
  const { error: membersError } = await supabase
    .from('group_members')
    .insert(memberInserts);

  if (membersError) throw membersError;

  return groupId;
};

// Get all expenses for current user
export const getUserExpenses = async (): Promise<Expense[]> => {
  const userId = await getCurrentUserId();
  
  // Get expense IDs where user is a participant
  const participantExpenseIds = await getUserExpenseIds();
  
  // Build the OR condition dynamically
  let orCondition = `paid_by_id.eq.${userId}`;
  if (participantExpenseIds.length > 0) {
    orCondition += `,id.in.(${participantExpenseIds.join(',')})`;
  }
  
  // Get expenses where user is involved (as payer or participant)
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select(`
      *,
      expense_participants (
        user_id,
        share
      ),
      expense_history (
        actor_id,
        action,
        details,
        created_at
      )
    `)
    .or(orCondition);

  if (error) throw error;

  // Get all users for transformation
  const allUsers = await getAllProfiles();
  const userMap = new Map(allUsers.map(user => [user.id, user]));

  return (expenses || []).map(expense => transformExpense(expense, userMap));
};

// Helper to get expense IDs where user is a participant
const getUserExpenseIds = async (): Promise<string[]> => {
  const userId = await getCurrentUserId();
  
  const { data: participations, error } = await supabase
    .from('expense_participants')
    .select('expense_id')
    .eq('user_id', userId);

  if (error) throw error;

  return participations?.map(p => p.expense_id) || [];
};

// Transform database expense to Expense type
const transformExpense = (expense: any, userMap: Map<string, User>): Expense => {
  const paidBy = userMap.get(expense.paid_by_id);
  if (!paidBy) throw new Error(`User not found: ${expense.paid_by_id}`);

  const participants = (expense.expense_participants || []).map((p: any) => {
    const user = userMap.get(p.user_id);
    if (!user) throw new Error(`Participant user not found: ${p.user_id}`);
    
    return {
      user,
      share: parseFloat(p.share),
    };
  });

  const history: AuditEntry[] = (expense.expense_history || []).map((h: any) => {
    const actor = userMap.get(h.actor_id);
    if (!actor) throw new Error(`History actor not found: ${h.actor_id}`);
    
    return {
      actor,
      action: h.action,
      details: h.details,
      timestamp: h.created_at,
    };
  });

  return {
    id: expense.id,
    groupId: expense.group_id,
    description: expense.description,
    amount: parseFloat(expense.amount),
    paidBy,
    participants,
    date: expense.transaction_date,
    history,
    isSettlement: expense.is_settlement,
  };
};

// Add a new expense
export const addExpense = async (expenseData: Omit<Expense, 'id' | 'history'>): Promise<void> => {
  const userId = await getCurrentUserId();
  
  // Insert the expense
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      description: expenseData.description,
      amount: expenseData.amount,
      paid_by_id: expenseData.paidBy.id.startsWith('invited_') 
        ? expenseData.paidBy.id.replace('invited_', '') 
        : expenseData.paidBy.id,
      group_id: expenseData.groupId || null,
      is_settlement: expenseData.isSettlement || false,
      transaction_date: expenseData.date,
    })
    .select('id')
    .single();

  if (expenseError) throw expenseError;

  const expenseId = expense.id;

  // Insert participants
  const participantInserts = expenseData.participants.map(p => ({
    expense_id: expenseId,
    user_id: p.user.id.startsWith('invited_') 
      ? p.user.id.replace('invited_', '') 
      : p.user.id,
    share: p.share,
  }));

  const { error: participantsError } = await supabase
    .from('expense_participants')
    .insert(participantInserts);

  if (participantsError) throw participantsError;

  // Insert history entry
  const { error: historyError } = await supabase
    .from('expense_history')
    .insert({
      expense_id: expenseId,
      actor_id: userId,
      action: 'created this expense',
    });

  if (historyError) throw historyError;
};

// Update an existing expense
export const updateExpense = async (
  expenseId: string, 
  expenseData: Omit<Expense, 'id' | 'history'>,
  auditAction: string,
  auditDetails?: string
): Promise<void> => {
  const userId = await getCurrentUserId();
  
  // Update the expense
  const { error: expenseError } = await supabase
    .from('expenses')
    .update({
      description: expenseData.description,
      amount: expenseData.amount,
      paid_by_id: expenseData.paidBy.id.startsWith('invited_') 
        ? expenseData.paidBy.id.replace('invited_', '') 
        : expenseData.paidBy.id,
      group_id: expenseData.groupId || null,
      transaction_date: expenseData.date,
    })
    .eq('id', expenseId);

  if (expenseError) throw expenseError;

  // Delete existing participants
  const { error: deleteError } = await supabase
    .from('expense_participants')
    .delete()
    .eq('expense_id', expenseId);

  if (deleteError) throw deleteError;

  // Insert new participants
  const participantInserts = expenseData.participants.map(p => ({
    expense_id: expenseId,
    user_id: p.user.id.startsWith('invited_') 
      ? p.user.id.replace('invited_', '') 
      : p.user.id,
    share: p.share,
  }));

  const { error: participantsError } = await supabase
    .from('expense_participants')
    .insert(participantInserts);

  if (participantsError) throw participantsError;

  // Insert history entry
  const { error: historyError } = await supabase
    .from('expense_history')
    .insert({
      expense_id: expenseId,
      actor_id: userId,
      action: auditAction,
      details: auditDetails,
    });

  if (historyError) throw historyError;
};

// Record settlement
export const recordSettlement = async (
  payee: User,
  settlements: { groupId: string; amount: number }[]
): Promise<void> => {
  for (const settlement of settlements) {
    const settlementData: Omit<Expense, 'id' | 'history'> = {
      description: `Payment to ${payee.name}`,
      amount: settlement.amount,
      paidBy: await getCurrentUserProfile(),
      participants: [{ user: payee, share: settlement.amount }],
      date: new Date().toISOString(),
      groupId: settlement.groupId || undefined,
      isSettlement: true,
    };

    await addExpense(settlementData);
  }
};

// Record reverse settlement (someone paid you)
export const recordSettlementReverse = async (
  payer: User,
  settlements: { groupId: string; amount: number }[]
): Promise<void> => {
  for (const settlement of settlements) {
    const settlementData: Omit<Expense, 'id' | 'history'> = {
      description: `Payment from ${payer.name}`,
      amount: settlement.amount,
      paidBy: payer,
      participants: [{ user: await getCurrentUserProfile(), share: settlement.amount }],
      date: new Date().toISOString(),
      groupId: settlement.groupId || undefined,
      isSettlement: true,
    };

    await addExpense(settlementData);
  }
};
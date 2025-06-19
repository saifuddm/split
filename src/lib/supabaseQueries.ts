import { supabase } from './supabaseClient';
import type { User, Group, Expense, AuditEntry, Contact } from './types';

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

// Transform contact to User type for UI compatibility
const transformContactToUser = (contact: any, userProfiles: User[]): User => {
  if (contact.contactUserId) {
    // Registered user - find their profile
    const userProfile = userProfiles.find(u => u.id === contact.contactUserId);
    if (userProfile) {
      return userProfile;
    }
  }
  
  // Invited user or fallback - ensure name is always a string
  const contactName = contact.contactName || contact.contactEmail || 'Unknown User';
  
  return {
    id: `contact_${contact.id}`, // Special prefix for contacts
    name: contactName,
    email: contact.contactEmail,
    avatarUrl: undefined,
    paymentMessage: undefined,
    isInvited: contact.isInvited,
  };
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
  // Use the server-side function to delete the current user
  const { error } = await supabase.rpc('delete_current_user');
  
  if (error) throw error;
};

// Get user's contacts
export const getUserContacts = async (): Promise<Contact[]> => {
  const userId = await getCurrentUserId();
  
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) throw error;

  return contacts || [];
};

// Get all users that the current user can interact with (contacts + group members)
export const getAllProfiles = async (): Promise<User[]> => {
  const userId = await getCurrentUserId();
  
  // Get user's contacts
  const contacts = await getUserContacts();
  
  // Get all registered user profiles that are either contacts or group members
  const contactUserIds = contacts
    .filter(c => c.contactUserId)
    .map(c => c.contactUserId);
  
  // Get group member IDs
  const { data: groupMemberships, error: groupError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (groupError) throw groupError;

  const groupIds = groupMemberships?.map(gm => gm.group_id) || [];
  
  let groupMemberIds: string[] = [];
  if (groupIds.length > 0) {
    const { data: allGroupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .in('group_id', groupIds);

    if (membersError) throw membersError;
    groupMemberIds = allGroupMembers?.map(gm => gm.user_id) || [];
  }

  // Combine and deduplicate user IDs
  const allUserIds = [...new Set([...contactUserIds, ...groupMemberIds])];
  
  let registeredUsers: User[] = [];
  if (allUserIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', allUserIds);

    if (profilesError) throw profilesError;
    registeredUsers = (profiles || []).map(transformProfile);
  }

  // Transform contacts to users (including invited ones)
  const contactUsers = contacts.map(contact => transformContactToUser(contact, registeredUsers));
  
  // Combine and deduplicate
  const allUsers = new Map<string, User>();
  
  // Add registered users first
  registeredUsers.forEach(user => allUsers.set(user.id, user));
  
  // Add contact users (this will include invited users and won't duplicate registered ones)
  contactUsers.forEach(user => {
    if (!allUsers.has(user.id)) {
      allUsers.set(user.id, user);
    }
  });

  return Array.from(allUsers.values());
};

// Add contact by email
export const addContactByEmail = async (email: string, fullName?: string): Promise<void> => {
  const userId = await getCurrentUserId();
  
  // First check if this email belongs to an existing user
  // Note: This query may return a 406 error if no user is found, which is expected behavior
  const { data: existingUser, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid throwing on no results

  // Only throw if it's a real error, not just "no user found"
  if (userError && userError.code !== 'PGRST116') {
    throw userError;
  }

  if (existingUser) {
    // User exists - add as registered contact
    const { error } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        contact_user_id: existingUser.id,
        contact_name: fullName?.trim() || existingUser.full_name || 'Unknown User',
        is_invited: false,
      });

    if (error) throw error;
  } else {
    // User doesn't exist - add as invited contact
    const contactName = fullName?.trim() || email.split('@')[0] || 'Unknown User';
    
    const { error } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        contact_email: email.toLowerCase().trim(),
        contact_name: contactName,
        is_invited: true,
      });

    if (error) throw error;
  }
};

// Remove contact
export const removeContact = async (contactId: string): Promise<void> => {
  const userId = await getCurrentUserId();
  
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('user_id', userId);

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

  // Get all user profiles for group members
  const memberIds = [...new Set(allMemberships?.map(m => m.user_id) || [])];
  
  let userProfiles: User[] = [];
  if (memberIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', memberIds);

    if (profilesError) throw profilesError;
    userProfiles = (profiles || []).map(transformProfile);
  }

  const userMap = new Map(userProfiles.map(user => [user.id, user]));

  // Build groups with members
  const groups: Group[] = [];
  const processedGroups = new Set();

  for (const membership of groupMemberships || []) {
    const groupId = membership.group_id;
    
    if (processedGroups.has(groupId)) continue;
    processedGroups.add(groupId);

    const groupMembers = (allMemberships || [])
      .filter(m => m.group_id === groupId)
      .map(m => userMap.get(m.user_id))
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

  // Get all user profiles for the emails
  const { data: existingUsers, error: usersError } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', memberEmails.map(email => email.toLowerCase().trim()));

  if (usersError) throw usersError;

  const usersByEmail = new Map((existingUsers || []).map(user => [user.email, user.id]));

  // Prepare member insertions
  const memberInserts = [];

  // Add creator
  memberInserts.push({
    group_id: groupId,
    user_id: userId,
  });

  // Add other members (only registered users can be in groups)
  for (const email of memberEmails) {
    const normalizedEmail = email.toLowerCase().trim();
    const userId = usersByEmail.get(normalizedEmail);
    if (userId) {
      memberInserts.push({
        group_id: groupId,
        user_id: userId,
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
  
  // Extract actual user ID (remove contact_ prefix if present)
  const getActualUserId = (id: string) => {
    if (id.startsWith('contact_')) {
      // For contact users, we need to get the actual user ID from the contact
      // This is a placeholder - in a real implementation, you'd need to handle this properly
      return id.replace('contact_', '');
    }
    return id;
  };

  // Insert the expense
  const { data: expense, error: expenseError } = await supabase
    .from('expenses')
    .insert({
      description: expenseData.description,
      amount: expenseData.amount,
      paid_by_id: getActualUserId(expenseData.paidBy.id),
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
    user_id: getActualUserId(p.user.id),
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
  
  // Extract actual user ID (remove contact_ prefix if present)
  const getActualUserId = (id: string) => {
    if (id.startsWith('contact_')) {
      return id.replace('contact_', '');
    }
    return id;
  };
  
  // Update the expense
  const { error: expenseError } = await supabase
    .from('expenses')
    .update({
      description: expenseData.description,
      amount: expenseData.amount,
      paid_by_id: getActualUserId(expenseData.paidBy.id),
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
    user_id: getActualUserId(p.user.id),
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
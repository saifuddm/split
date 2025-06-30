import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import supabase, { type DbUser, type DbGroup } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';

export interface AuthState {
  user: DbUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  contacts: DbUser[] | null;
  groups: {
    details: DbGroup ;
    members: DbUser[];
  }[]
}

interface AuthActions {
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  updatePaymentMessage: (paymentMessage: string) => Promise<void>;
  getContactsForUser: (userId: number) => Promise<DbUser[]>;
  addContact: (email: string) => Promise<{ error?: string; user?: DbUser; isNewUser?: boolean }>;
  createGroup: (name: string, members: DbUser[]) => Promise<{ error?: string; success?: boolean; group?: DbGroup }>;
  getGroupsForUser: (userId: number) => Promise<AuthState['groups']>;
}

export interface AuthStore extends AuthState {
  actions: AuthActions;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      contacts: null,
      groups: [],
      // Actions
      actions: {
        initialize: async () => {
          try {
            set({ isLoading: true });
            
            // Get current session
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Error getting session:', error);
              set({ user: null, session: null, isAuthenticated: false, isLoading: false, contacts: null });
              return;
            }

            if (session?.user) {
              // Fetch user data from database on initial load
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

              if (userError) {
                console.error('Error fetching user data:', userError);
              }

              set({ 
                user: userData || null,
                session, 
                isAuthenticated: true, 
                isLoading: false 
              });
            } else {
              set({ user: null, session: null, isAuthenticated: false, isLoading: false, contacts: null });
            }

            // Set up auth state listener
            supabase.auth.onAuthStateChange(async (event, session) => {
              if (session?.user) {
                // Fetch user data from database when session changes
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('*')
                  .eq('user_id', session.user.id)
                  .single();

                if (userError) {
                  console.error('Error fetching user data:', userError);
                }

                set({ 
                  user: userData || null,
                  session, 
                  isAuthenticated: true, 
                  isLoading: false 
                });
              } else {
                set({ user: null, session: null, isAuthenticated: false, isLoading: false, contacts: null });
              }
            });
          } catch (error) {
            console.error('Error initializing auth:', error);
            set({ user: null, session: null, isAuthenticated: false, isLoading: false, contacts: null });
          }
        },

        signUp: async (email: string, password: string, name: string) => {
          try {
            set({ isLoading: true });
            
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  name: name,
                }
              }
            });

            if (error || !data.user) {
              set({ isLoading: false });
              return { error: error?.message || 'An unexpected error occurred. Please try again.' };
            }

            // If signup is successful but email confirmation is required
            if (data.user && !data.session) {
              set({ isLoading: false });
              return { error: 'Please check your email to confirm your account before signing in.' };
            }

            // Create user in database
            const { data: userData, error: userError } = await supabase
              .from('users')
              .insert({
                user_id: data.user.id,
                name: name,
              }).select().single();

            if (userError) {
                set({ isLoading: false });
                return { error: userError.message };
            }

            if (userData) {
                set({ user: userData });
            }

            set({ isLoading: false });
            return {};
          } catch (error) {
            set({ isLoading: false });
            return { error: 'An unexpected error occurred. Please try again.' };
          }
        },

        signIn: async (email: string, password: string) => {
          try {
            set({ isLoading: true });
            
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) {
              set({ isLoading: false });
              return { error: error.message };
            }

            // Fetch user data from database
            if (data.user) {
              const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', data.user.id)
                .single();

              if (userError) {
                console.error('Error fetching user data:', userError);
                // Continue with login even if user data fetch fails
              } else if (userData) {
                set({ user: userData });
              }
            }

            set({ isLoading: false });
            return {};
          } catch (error) {
            set({ isLoading: false });
            return { error: 'An unexpected error occurred. Please try again.' };
          }
        },

        signOut: async () => {
          try {
            set({ isLoading: true });
            await supabase.auth.signOut();
            set({ user: null, session: null, isAuthenticated: false, isLoading: false, contacts: null });
            
          } catch (error) {
            console.error('Error signing out:', error);
            set({ isLoading: false });
          }
        },

        updatePaymentMessage: async (paymentMessage: string) => {
          try {
            const userId = get().user?.id;
            if (!userId || !get().user) {
                throw new Error('User ID not found');
            }
            const { data, error } = await supabase.from('users').update({ payment_message: paymentMessage }).eq('id', userId).select().single();

            if (error || !data) {
                throw new Error(error.message);
            }

            set({ user: data });
          } catch (error) {
            console.error('Error updating payment message:', error);
          }
        },

        getContactsForUser: async (userId: number) => {
            const { data, error } = await supabase.from('user_contacts').select('contact_user_id').eq('user_id', userId);

            if (error || !data) {
                throw new Error(error.message);
            }

            console.log("Contacts for user", userId, data);

            const contacts = await Promise.all(data.map(async (contact) => {
                const { data: contactData, error: contactError } = await supabase.from('users').select('*').eq('id', contact.contact_user_id).single();
                if (contactError || !contactData) {
                    throw new Error(contactError.message);
                }
                return contactData;
            }));

            set({ contacts });

            return contacts;
        },

        addContact: async (email: string) => {
          try {
            const currentUser = get().user;
            if (!currentUser) {
              return { error: 'User not authenticated' };
            }

            // Call the edge function to find or invite the user
            const { data, error } = await supabase.functions.invoke('invite-user', {
              body: { email }
            });

            if (error) {
              return { error: error.message };
            }

            if (!data.success || !data.user) {
              return { error: 'Failed to find or invite user' };
            }

            const contactUser = data.user;

            // Check if contact already exists
            const { data: existingContact, error: checkError } = await supabase
              .from('user_contacts')
              .select('id')
              .eq('user_id', currentUser.id)
              .eq('contact_user_id', contactUser.id)
              .single();

            if (existingContact) {
              return { error: 'This user is already in your contacts' };
            }

            // Add to user_contacts table
            const { error: insertError } = await supabase
              .from('user_contacts')
              .insert({
                user_id: currentUser.id,
                contact_user_id: contactUser.id
              });

            if (insertError) {
              return { error: insertError.message };
            }

            // Update local contacts state
            const currentContacts = get().contacts || [];
            set({ contacts: [...currentContacts, contactUser] });

            return { 
              user: contactUser, 
              isNewUser: data.isNewUser 
            };
          } catch (error) {
            console.error('Error adding contact:', error);
            return { error: 'An unexpected error occurred' };
          }
        },

        createGroup: async (name: string, members: DbUser[]) => {
          try {
            const currentUser = get().user;
            if (!currentUser) {
              return { error: 'User not authenticated' };
            }

            // Create group
            const { data: groupData, error: groupError } = await supabase.from('groups').insert({
              name: name,
            }).select().single();

            if (groupError || !groupData) {
              return { error: groupError?.message || 'Failed to create group' };
            }

            // Add current user to the group members list if not already included
            const allMembers = members.some(member => member.id === currentUser.id) 
              ? members 
              : [...members, currentUser];

            // Create group members - use Promise.all with proper error handling
            const memberInserts = allMembers.map(member => 
              supabase.from('group_members').insert({
                group_id: groupData.id,
                user_id: member.id,
              })
            );

            const results = await Promise.all(memberInserts);
            
            // Check if any member insert failed
            const failedInsert = results.find(result => result.error);
            if (failedInsert?.error) {
              return { error: failedInsert.error.message };
            }

            return { success: true, group: groupData };
            
          } catch (error) {
            console.error('Error creating group:', error);
            return { error: 'An unexpected error occurred while creating the group' };
          }
        },

        getGroupsForUser: async (userId: number) => {
          try {
            // First: Get group IDs where the user is a member
            const { data: userGroups, error: userGroupsError } = await supabase
              .from('group_members')
              .select('group_id')
              .eq('user_id', userId);

            if (userGroupsError || !userGroups) {
              throw new Error(userGroupsError?.message || 'Failed to fetch user groups');
            }

            const groupIds = userGroups.map(item => item.group_id);

            if (groupIds.length === 0) {
              set({ groups: [] });
              return [];
            }

            // Second: Get all groups and their members with user details in a single optimized query
            const { data: groupsWithMembers, error: groupsError } = await supabase
              .from('group_members')
              .select(`
                group_id,
                user_id,
                groups!inner (
                  id,
                  name,
                  created_at
                ),
                users!inner (
                  id,
                  user_id,
                  name,
                  avatar_url,
                  payment_message,
                  created_at
                )
              `)
              .in('group_id', groupIds);

            if (groupsError || !groupsWithMembers) {
              throw new Error(groupsError?.message || 'Failed to fetch groups and members');
            }

            // Group the data by group_id and build the final structure
            const groupsMap = new Map<number, { details: DbGroup; members: DbUser[] }>();

            groupsWithMembers.forEach(item => {
              const groupId = item.group_id;
              const group = item.groups as DbGroup;
              const member = item.users as DbUser;

              if (!groupsMap.has(groupId)) {
                groupsMap.set(groupId, {
                  details: group,
                  members: []
                });
              }

              const groupData = groupsMap.get(groupId)!;
              
              // Avoid duplicate members
              if (!groupData.members.some(existingMember => existingMember.id === member.id)) {
                groupData.members.push(member);
              }
            });

            const result = Array.from(groupsMap.values());
            
            // Update the store with the groups
            set({ groups: result });
            
            return result;
          } catch (error) {
            console.error('Error fetching groups for user:', error);
            throw error;
          }
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        contacts: state.contacts,
        groups: state.groups,
      }),
    }
  )
); 
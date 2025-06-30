import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import supabase, { type DbUser } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';

export interface AuthState {
  user: DbUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  updatePaymentMessage: (paymentMessage: string) => Promise<void>;
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

      // Actions
      actions: {
        initialize: async () => {
          try {
            set({ isLoading: true });
            
            // Get current session
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error('Error getting session:', error);
              set({ user: null, session: null, isAuthenticated: false, isLoading: false });
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
              set({ user: null, session: null, isAuthenticated: false, isLoading: false });
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
                set({ user: null, session: null, isAuthenticated: false, isLoading: false });
              }
            });
          } catch (error) {
            console.error('Error initializing auth:', error);
            set({ user: null, session: null, isAuthenticated: false, isLoading: false });
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
            set({ user: null, session: null, isAuthenticated: false, isLoading: false });
            
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
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 
import { createClient } from '@supabase/supabase-js';
import type { Database } from './lib/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export user table types
export type DbUser = Database['public']['Tables']['users']['Row'];
export type DbUserInsert = Database['public']['Tables']['users']['Insert'];
export type DbUserUpdate = Database['public']['Tables']['users']['Update'];

export type DbUserContact = Database['public']['Tables']['user_contacts']['Row'];
export type DbUserContactInsert = Database['public']['Tables']['user_contacts']['Insert'];
export type DbUserContactUpdate = Database['public']['Tables']['user_contacts']['Update'];

export type DbGroup = Database['public']['Tables']['groups']['Row'];
export type DbGroupInsert = Database['public']['Tables']['groups']['Insert'];
export type DbGroupUpdate = Database['public']['Tables']['groups']['Update'];

export type DbGroupMember = Database['public']['Tables']['group_members']['Row'];
export type DbGroupMemberInsert = Database['public']['Tables']['group_members']['Insert'];
export type DbGroupMemberUpdate = Database['public']['Tables']['group_members']['Update'];

export type DbExpense = Database['public']['Tables']['expenses']['Row'];
export type DbExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
export type DbExpenseUpdate = Database['public']['Tables']['expenses']['Update'];

export type DbExpenseMember = Database['public']['Tables']['expense_members']['Row'];
export type DbExpenseMemberInsert = Database['public']['Tables']['expense_members']['Insert'];
export type DbExpenseMemberUpdate = Database['public']['Tables']['expense_members']['Update'];

export default supabase;
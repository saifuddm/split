/*
  # Add email support and invited users functionality

  1. New Tables
    - `invited_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text, optional)
      - `invited_by` (uuid, references profiles)
      - `invited_at` (timestamp)

  2. Changes
    - Add `email` column to `profiles` table
    - Update user signup trigger to handle invited users
    - Add RLS policies for invited users
    - Update existing policies for better performance
    - Add performance indexes

  3. Security
    - Enable RLS on `invited_users` table
    - Add policies for viewing, inserting, updating, and deleting invited users
    - Update profiles policies to handle new structure
*/

-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Create a separate table for invited users (placeholders)
CREATE TABLE IF NOT EXISTS public.invited_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on invited_users
ALTER TABLE public.invited_users ENABLE ROW LEVEL SECURITY;

-- Drop the old trigger and function to replace them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the new function to handle user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invited_user_record public.invited_users%ROWTYPE;
BEGIN
  -- Check if this email was previously invited
  SELECT * INTO invited_user_record 
  FROM public.invited_users 
  WHERE email = new.email;

  -- Insert the new profile
  INSERT INTO public.profiles (id, full_name, avatar_url, email, created_at, updated_at)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', invited_user_record.full_name),
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    NOW(),
    NOW()
  );

  -- If they were invited, clean up the invited_users record
  IF FOUND THEN
    DELETE FROM public.invited_users WHERE email = new.email;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing profiles to have email from auth.users
UPDATE public.profiles 
SET email = au.email 
FROM auth.users au 
WHERE public.profiles.id = au.id AND public.profiles.email IS NULL;

-- RLS Policies for invited_users table
DROP POLICY IF EXISTS "Users can view invited users in their groups" ON public.invited_users;
DROP POLICY IF EXISTS "Users can view invited users they created" ON public.invited_users;
DROP POLICY IF EXISTS "Users can view invited users in shared groups" ON public.invited_users;
DROP POLICY IF EXISTS "Users can insert invited users" ON public.invited_users;
DROP POLICY IF EXISTS "Users can update invited users they created" ON public.invited_users;
DROP POLICY IF EXISTS "Users can delete invited users they created" ON public.invited_users;

CREATE POLICY "Users can view invited users in shared groups"
  ON public.invited_users
  FOR SELECT
  TO authenticated
  USING (
    invited_by IN (
      SELECT DISTINCT gm2.user_id 
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invited users in their groups"
  ON public.invited_users
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT gm2.user_id 
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view invited users they created"
  ON public.invited_users
  FOR SELECT
  TO authenticated
  USING (invited_by = auth.uid());

CREATE POLICY "Users can insert invited users"
  ON public.invited_users
  FOR INSERT
  TO authenticated
  WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Users can update invited users they created"
  ON public.invited_users
  FOR UPDATE
  TO authenticated
  USING (invited_by = auth.uid());

CREATE POLICY "Users can delete invited users they created"
  ON public.invited_users
  FOR DELETE
  TO authenticated
  USING (invited_by = auth.uid());

-- Update RLS policies for profiles to handle the new structure
DROP POLICY IF EXISTS "Users can view other profiles they interact with" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of people in their groups" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles of people in their groups"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT gm2.user_id 
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

-- Allow group members to reference invited users in group_members table
-- Update group_members to allow references to invited_users
ALTER TABLE public.group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;

-- We'll handle the relationship through application logic since we need to support both tables

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invited_users_email ON public.invited_users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON public.expense_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_id ON public.expenses(paid_by_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_transaction_date ON public.expenses(transaction_date);
CREATE INDEX IF NOT EXISTS idx_expense_history_expense_id ON public.expense_history(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_history_actor_id ON public.expense_history(actor_id);
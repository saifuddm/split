/*
  # Update profiles table to support email invitations

  1. Schema Changes
    - Make id column nullable to allow placeholder profiles
    - Add unique email column for invited users
    - Update trigger to handle existing placeholder profiles

  2. Security
    - Update RLS policies to handle nullable id
    - Ensure invited users can be seen by group members
*/

-- Make the ID nullable to allow for placeholder profiles
ALTER TABLE public.profiles ALTER COLUMN id DROP NOT NULL;

-- Add a unique email column to identify invited users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Drop the old trigger and function to replace them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- Create the new, more powerful function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if a placeholder profile with this email already exists
  UPDATE public.profiles
  SET 
    id = new.id, 
    full_name = COALESCE(new.raw_user_meta_data->>'full_name', full_name),
    avatar_url = COALESCE(new.raw_user_meta_data->>'avatar_url', avatar_url),
    updated_at = NOW()
  WHERE email = new.email AND id IS NULL;

  -- If no profile was updated (i.e., no placeholder existed), insert a new one
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, full_name, avatar_url, email, created_at, updated_at)
    VALUES (
      new.id, 
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'avatar_url',
      new.email,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies to handle nullable id and email-based invites
DROP POLICY IF EXISTS "Users can view other profiles they interact with" ON public.profiles;

CREATE POLICY "Users can view other profiles they interact with"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing own profile
    id = auth.uid()
    OR
    -- Allow viewing profiles of users in same groups
    id IN (
      SELECT DISTINCT gm2.user_id 
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
      
      UNION
      
      -- Users in individual expenses together
      SELECT DISTINCT ep2.user_id
      FROM public.expense_participants ep1
      JOIN public.expense_participants ep2 ON ep1.expense_id = ep2.expense_id
      JOIN public.expenses e ON ep1.expense_id = e.id
      WHERE ep1.user_id = auth.uid() AND e.group_id IS NULL
      
      UNION
      
      -- Users who paid for expenses current user is involved in
      SELECT DISTINCT e.paid_by_id
      FROM public.expenses e
      JOIN public.expense_participants ep ON e.id = ep.expense_id
      WHERE ep.user_id = auth.uid()
    )
  );

-- Allow users to view invited profiles (placeholder profiles with null id)
CREATE POLICY "Users can view invited profiles in their groups"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id IS NULL AND email IN (
      SELECT DISTINCT p.email
      FROM public.group_members gm1
      JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
      JOIN public.profiles p ON gm2.user_id = p.id
      WHERE gm1.user_id = auth.uid()
    )
  );
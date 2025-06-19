/*
  # Create Contact System

  1. New Tables
    - `contacts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `contact_user_id` (uuid, references profiles, nullable for invited users)
      - `contact_email` (text, for invited users)
      - `contact_name` (text, display name)
      - `is_invited` (boolean, true if contact hasn't signed up yet)
      - `added_at` (timestamp)

  2. Security
    - Enable RLS on `contacts` table
    - Add policies for users to manage their own contacts
    - Remove invited_users table (replaced by contacts system)

  3. Changes
    - Users can only see contacts they've added
    - Invited users are stored as contacts with is_invited=true
    - Group members don't automatically become contacts
*/

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_email TEXT,
  contact_name TEXT NOT NULL,
  is_invited BOOLEAN DEFAULT false,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure either contact_user_id or contact_email is set (but not both for invited users)
  CONSTRAINT contacts_user_or_email_check CHECK (
    (contact_user_id IS NOT NULL AND contact_email IS NULL AND is_invited = false) OR
    (contact_user_id IS NULL AND contact_email IS NOT NULL AND is_invited = true)
  ),
  
  -- Prevent duplicate contacts
  UNIQUE(user_id, contact_user_id),
  UNIQUE(user_id, contact_email)
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "Users can view their own contacts"
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own contacts"
  ON public.contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own contacts"
  ON public.contacts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own contacts"
  ON public.contacts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON public.contacts(contact_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_email ON public.contacts(contact_email);

-- Function to automatically add contacts when users sign up from invitations
CREATE OR REPLACE FUNCTION public.handle_contact_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new user signs up, check if they were invited by others
  -- and convert those invited contacts to registered contacts
  UPDATE public.contacts 
  SET 
    contact_user_id = NEW.id,
    contact_email = NULL,
    is_invited = false
  WHERE 
    contact_email = NEW.email 
    AND is_invited = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to handle contact signup
DROP TRIGGER IF EXISTS on_contact_user_signup ON public.profiles;
CREATE TRIGGER on_contact_user_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_contact_signup();

-- Migrate existing invited_users to contacts system
DO $$
DECLARE
  invited_record RECORD;
BEGIN
  -- Only run if invited_users table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invited_users') THEN
    FOR invited_record IN 
      SELECT * FROM public.invited_users
    LOOP
      INSERT INTO public.contacts (
        user_id,
        contact_email,
        contact_name,
        is_invited,
        added_at
      ) VALUES (
        invited_record.invited_by,
        invited_record.email,
        COALESCE(invited_record.full_name, split_part(invited_record.email, '@', 1)),
        true,
        invited_record.invited_at
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- Update profiles RLS policies to work with contact system
DROP POLICY IF EXISTS "Users can view profiles of people in their groups" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view profiles of their contacts"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT contact_user_id 
      FROM public.contacts 
      WHERE user_id = auth.uid() AND contact_user_id IS NOT NULL
    )
  );

CREATE POLICY "Users can view profiles of group members"
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

-- Clean up old invited_users table (after migration)
-- Note: We'll keep this commented out for safety, can be run manually later
-- DROP TABLE IF EXISTS public.invited_users;
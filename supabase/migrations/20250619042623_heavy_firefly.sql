/*
  # Split App Database Schema

  1. New Tables
    - `profiles` - Public user profiles linked to auth.users
    - `groups` - Expense groups/trips
    - `group_members` - Junction table for group membership (many-to-many)
    - `expenses` - All transactions (expenses and settlements)
    - `expense_participants` - Normalized participant shares for each expense
    - `expense_history` - Audit trail for expense changes

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Users can only see groups they're members of
    - Users can only see expenses they're involved in

  3. Automation
    - Trigger to auto-create profile when user signs up
    - Indexes for performance on frequently queried columns
*/

-- Create profiles table (public user data linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  payment_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create group_members junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create expenses table (handles both regular expenses and settlements)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  paid_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE, -- Nullable for individual expenses
  is_settlement BOOLEAN NOT NULL DEFAULT false,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create expense_participants table (normalized participant shares)
CREATE TABLE IF NOT EXISTS public.expense_participants (
  id BIGSERIAL PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  share NUMERIC(10, 2) NOT NULL CHECK (share >= 0),
  UNIQUE (expense_id, user_id) -- A user can only be a participant once per expense
);

ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;

-- Create expense_history table (audit trail)
CREATE TABLE IF NOT EXISTS public.expense_history (
  id BIGSERIAL PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.expense_history ENABLE ROW LEVEL SECURITY;

-- Function to automatically create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view other profiles they interact with"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      -- Users in the same groups
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

-- RLS Policies for groups
CREATE POLICY "Users can view groups they are members of"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can update their groups"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- RLS Policies for group_members
CREATE POLICY "Users can view group memberships for their groups"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group creators can manage group membership"
  ON public.group_members
  FOR ALL
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM public.groups WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can join groups (insert their own membership)"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses they are involved in"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (
    -- User is the payer
    paid_by_id = auth.uid()
    OR
    -- User is a participant
    id IN (SELECT expense_id FROM public.expense_participants WHERE user_id = auth.uid())
    OR
    -- Expense belongs to a group the user is a member of
    group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create expenses"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be the payer
    paid_by_id = auth.uid()
    AND
    -- If it's a group expense, user must be a member of that group
    (group_id IS NULL OR group_id IN (
      SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update expenses they created"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (paid_by_id = auth.uid());

-- RLS Policies for expense_participants
CREATE POLICY "Users can view expense participants for expenses they can see"
  ON public.expense_participants
  FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE 
        paid_by_id = auth.uid()
        OR id IN (SELECT expense_id FROM public.expense_participants WHERE user_id = auth.uid())
        OR group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage participants for expenses they created"
  ON public.expense_participants
  FOR ALL
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM public.expenses WHERE paid_by_id = auth.uid()
    )
  );

-- RLS Policies for expense_history
CREATE POLICY "Users can view expense history for expenses they can see"
  ON public.expense_history
  FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE 
        paid_by_id = auth.uid()
        OR id IN (SELECT expense_id FROM public.expense_participants WHERE user_id = auth.uid())
        OR group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create expense history entries"
  ON public.expense_history
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_id ON public.expenses(paid_by_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_transaction_date ON public.expenses(transaction_date);
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user_id ON public.expense_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_history_expense_id ON public.expense_history(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_history_actor_id ON public.expense_history(actor_id);
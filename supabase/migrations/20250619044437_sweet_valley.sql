/*
  # Fix infinite recursion in RLS policies

  1. Policy Updates
    - Simplify group_members policies to avoid circular references
    - Fix expense_participants policies to prevent recursion
    - Update groups policies to remove complex subqueries
    - Ensure policies are straightforward and don't reference themselves

  2. Security
    - Maintain proper access control while eliminating recursion
    - Keep policies simple and direct
    - Use auth.uid() directly where possible
*/

-- Drop existing problematic policies for group_members
DROP POLICY IF EXISTS "Group creators can manage all group membership" ON group_members;
DROP POLICY IF EXISTS "Users can join groups by inserting their own membership" ON group_members;
DROP POLICY IF EXISTS "Users can view memberships in groups they created" ON group_members;
DROP POLICY IF EXISTS "Users can view their own group memberships" ON group_members;

-- Create simplified group_members policies
CREATE POLICY "Users can view their own group memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view group memberships for groups they created"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own group membership"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Group creators can insert any membership"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT id FROM groups WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Group creators can update memberships"
  ON group_members
  FOR UPDATE
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Group creators can delete memberships"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (
    group_id IN (
      SELECT id FROM groups WHERE created_by = auth.uid()
    )
  );

-- Drop existing problematic policies for groups
DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON groups;

-- Create simplified groups policies
CREATE POLICY "Users can view groups they are members of"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can update their groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Drop existing problematic policies for expense_participants
DROP POLICY IF EXISTS "Users can manage participants for expenses they created" ON expense_participants;
DROP POLICY IF EXISTS "Users can view participants for expenses they participate in" ON expense_participants;
DROP POLICY IF EXISTS "Users can view participants for group expenses they can access" ON expense_participants;
DROP POLICY IF EXISTS "Users can view participants for their own expenses" ON expense_participants;

-- Create simplified expense_participants policies
CREATE POLICY "Users can view participants for their own expenses"
  ON expense_participants
  FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM expenses WHERE paid_by_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own participation"
  ON expense_participants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view participants for group expenses"
  ON expense_participants
  FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT e.id 
      FROM expenses e
      WHERE e.group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Expense creators can manage participants"
  ON expense_participants
  FOR ALL
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM expenses WHERE paid_by_id = auth.uid()
    )
  )
  WITH CHECK (
    expense_id IN (
      SELECT id FROM expenses WHERE paid_by_id = auth.uid()
    )
  );

-- Update profiles policies to be more straightforward
DROP POLICY IF EXISTS "Users can view other profiles they interact with" ON profiles;

CREATE POLICY "Users can view profiles of group members"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    id IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );

-- Update invited_users policies to be simpler
DROP POLICY IF EXISTS "Users can view invited users in their groups" ON invited_users;

CREATE POLICY "Users can view invited users they created"
  ON invited_users
  FOR SELECT
  TO authenticated
  USING (invited_by = auth.uid());

CREATE POLICY "Users can view invited users in shared groups"
  ON invited_users
  FOR SELECT
  TO authenticated
  USING (
    invited_by IN (
      SELECT DISTINCT gm2.user_id
      FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid()
    )
  );
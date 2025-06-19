/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - The `group_members` table has a SELECT policy that creates infinite recursion
    - The policy references itself when checking group membership
    - This causes the "infinite recursion detected in policy" error

  2. Solution
    - Drop the problematic policies
    - Create simpler, non-recursive policies
    - Ensure policies don't reference themselves or create circular dependencies

  3. Changes
    - Fix group_members SELECT policy to avoid self-reference
    - Simplify expense_participants policies to avoid recursion
    - Maintain security while eliminating circular dependencies
*/

-- Drop existing problematic policies for group_members
DROP POLICY IF EXISTS "Users can view group memberships for their groups" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage group membership" ON group_members;
DROP POLICY IF EXISTS "Users can join groups (insert their own membership)" ON group_members;

-- Create new non-recursive policies for group_members
CREATE POLICY "Users can view their own group memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view memberships in groups they created"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (group_id IN (
    SELECT id FROM groups WHERE created_by = auth.uid()
  ));

CREATE POLICY "Group creators can manage all group membership"
  ON group_members
  FOR ALL
  TO authenticated
  USING (group_id IN (
    SELECT id FROM groups WHERE created_by = auth.uid()
  ))
  WITH CHECK (group_id IN (
    SELECT id FROM groups WHERE created_by = auth.uid()
  ));

CREATE POLICY "Users can join groups by inserting their own membership"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Drop existing problematic policies for expense_participants
DROP POLICY IF EXISTS "Users can view expense participants for expenses they can see" ON expense_participants;
DROP POLICY IF EXISTS "Users can manage participants for expenses they created" ON expense_participants;

-- Create new non-recursive policies for expense_participants
CREATE POLICY "Users can view participants for their own expenses"
  ON expense_participants
  FOR SELECT
  TO authenticated
  USING (expense_id IN (
    SELECT id FROM expenses WHERE paid_by_id = auth.uid()
  ));

CREATE POLICY "Users can view participants for expenses they participate in"
  ON expense_participants
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view participants for group expenses they can access"
  ON expense_participants
  FOR SELECT
  TO authenticated
  USING (expense_id IN (
    SELECT e.id FROM expenses e
    INNER JOIN groups g ON e.group_id = g.id
    INNER JOIN group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage participants for expenses they created"
  ON expense_participants
  FOR ALL
  TO authenticated
  USING (expense_id IN (
    SELECT id FROM expenses WHERE paid_by_id = auth.uid()
  ))
  WITH CHECK (expense_id IN (
    SELECT id FROM expenses WHERE paid_by_id = auth.uid()
  ));
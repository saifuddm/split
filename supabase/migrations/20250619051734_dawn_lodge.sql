/*
  # Add user deletion function

  1. New Functions
    - `delete_current_user()` - Allows authenticated users to delete their own account
      - Deletes the user from auth.users table
      - Cascading deletes will handle related data in profiles, expenses, etc.
  
  2. Security
    - Function runs with SECURITY DEFINER to have necessary privileges
    - Only allows deletion of the currently authenticated user
    - Grants execution to authenticated role
*/

-- Create function to delete current user
CREATE OR REPLACE FUNCTION delete_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow users to delete their own account
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Delete the user from auth.users (this will cascade to delete related data)
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_current_user() TO authenticated;
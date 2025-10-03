/*
  # Fix Members RLS Policy for Anonymous Registration
  
  This migration fixes the Row Level Security policy on the members table to allow
  anonymous users to register. The issue is that the previous policy wasn't properly
  allowing anonymous (unauthenticated) users to insert records.
  
  1. Changes
    - Drop all existing policies on members table
    - Recreate policies with proper permissions for anonymous insert
    - Add separate policies for SELECT, INSERT, UPDATE, DELETE operations
  
  2. Security
    - Anonymous users CAN insert new member records (for registration)
    - Authenticated users CAN view their own records
    - Admins CAN do everything
*/

-- Drop all existing policies on members table
DROP POLICY IF EXISTS "Allow public insert for registration" ON public.members;
DROP POLICY IF EXISTS "Allow members to view own profile" ON public.members;
DROP POLICY IF EXISTS "Allow admins full access to members" ON public.members;
DROP POLICY IF EXISTS "Allow public access for new member registration" ON public.members;

-- Create new policies with explicit permissions

-- Policy 1: Allow ANYONE (including anonymous) to insert members
CREATE POLICY "Enable insert for everyone" ON public.members
FOR INSERT 
WITH CHECK (true);

-- Policy 2: Allow authenticated users to view their own profile
CREATE POLICY "Enable read for own profile" ON public.members
FOR SELECT 
TO authenticated
USING (email = auth.email());

-- Policy 3: Allow admins to select all members
CREATE POLICY "Enable select for admins" ON public.members
FOR SELECT 
TO authenticated
USING (public.is_admin());

-- Policy 4: Allow admins to update members
CREATE POLICY "Enable update for admins" ON public.members
FOR UPDATE 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Policy 5: Allow admins to delete members
CREATE POLICY "Enable delete for admins" ON public.members
FOR DELETE 
TO authenticated
USING (public.is_admin());

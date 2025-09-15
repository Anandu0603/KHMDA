/*
[FIX] Members Table RLS Policy - Allow Anonymous Registration
This fixes the "new row violates row-level security policy" error for anonymous member registration.
*/

-- Drop all potentially conflicting policies on members table
DROP POLICY IF EXISTS "Allow public access for new member registration" ON members;
DROP POLICY IF EXISTS "Anyone can insert members" ON members;
DROP POLICY IF EXISTS "Public can insert pending members" ON members;
DROP POLICY IF EXISTS "Public insert pending members" ON members;
DROP POLICY IF EXISTS "Allow public access for new member registration" ON public.members;
DROP POLICY IF EXISTS "Anyone can insert members" ON public.members;
DROP POLICY IF EXISTS "Public can insert pending members" ON public.members;
DROP POLICY IF EXISTS "Public insert pending members" ON public.members;

-- Create a simple, working policy for anonymous member registration
CREATE POLICY "anonymous_member_registration"
ON members 
FOR INSERT 
TO anon 
WITH CHECK (status = 'pending');

-- Also ensure RLS is enabled
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
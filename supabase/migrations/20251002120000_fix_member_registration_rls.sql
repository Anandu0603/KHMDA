
-- [FIX] Definitive RLS Policy for Member Registration
-- This migration resets all RLS policies on the members table and creates a secure set of policies.
-- It specifically fixes the "new row violates row-level security policy" error during anonymous registration.

-- 1. Temporarily disable RLS on the members table to prevent errors during policy changes.
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;

-- 2. Dynamically drop all existing policies on the public.members table.
-- This is a safety measure to ensure a clean slate, removing any old or conflicting policies.
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'members' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.members';
    END LOOP;
END $$;

-- 3. Re-enable RLS on the members table.
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 4. Grant basic permissions to roles.
-- Note: More specific access is controlled by RLS policies, not just these grants.
GRANT INSERT, SELECT ON public.members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;

-- 5. Create the essential RLS policies for the members table.

-- POLICY: Allow anonymous users to create new member records, but only with a 'pending' status.
-- This is the key policy that allows member registration to work.
CREATE POLICY "Allow anonymous registration for pending members"
ON public.members
FOR INSERT TO anon
WITH CHECK (status = 'pending');

-- POLICY: Allow authenticated users to view and update their own member record.
-- They are identified by matching their authentication email with the email in the members table.
CREATE POLICY "Allow authenticated users to manage their own record"
ON public.members
FOR ALL TO authenticated
USING (email = auth.email())
WITH CHECK (email = auth.email());

-- POLICY: Allow users with admin privileges (defined by the is_admin() function) to have full access to all member records.
CREATE POLICY "Allow admin full access to all members"
ON public.members
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- POLICY: Allow the service_role (used for server-side operations) to have unrestricted access.
CREATE POLICY "Allow service_role full access"
ON public.members
FOR ALL TO service_role
USING (true)
WITH CHECK (true);


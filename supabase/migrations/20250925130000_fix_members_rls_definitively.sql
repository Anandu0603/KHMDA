/*
[DEFINITIVE RLS FIX] Clean Reset of Members Table Policies
This migration completely drops all existing RLS policies on the members table and recreates minimal, secure policies.
It ensures anonymous users can only insert pending members, preventing the 42501 RLS violation during registration.
*/

-- Disable RLS temporarily
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on public.members using dynamic SQL
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

-- Re-enable RLS
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Core policy: Allow anonymous registration only for pending status
CREATE POLICY "anon_pending_registration" ON public.members
    FOR INSERT TO anon
    WITH CHECK (status = 'pending');

-- Allow authenticated users to view/update their own member record
CREATE POLICY "authenticated_own_member" ON public.members
    FOR ALL TO authenticated
    USING (email = auth.email())
    WITH CHECK (email = auth.email());

-- Allow admins full access to members (using existing is_admin() function)
CREATE POLICY "admin_full_members_access" ON public.members
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Service role full access
CREATE POLICY "service_role_members_full" ON public.members
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant necessary permissions to anon role
GRANT INSERT ON public.members TO anon;
GRANT SELECT ON public.members TO anon; -- For FK validation if needed

-- Grant to authenticated users
GRANT ALL ON public.members TO authenticated;

-- Ensure service_role has full access
GRANT ALL ON public.members TO service_role;

-- Verify RLS is enabled and policies are created
-- (This is for documentation; in production, check via Supabase dashboard)
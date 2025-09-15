/*
[DEFINITIVE FIX] Complete RLS Policy Reset for Members and Payments Tables
This migration completely resets all RLS policies and creates simple, working policies 
to allow anonymous user registration.
*/

-- === MEMBERS TABLE FIXES ===

-- First, disable RLS temporarily to clear all policies
ALTER TABLE members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on members table (both public and default schema)
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    -- Drop policies from public.members
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'members' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.members';
    END LOOP;
    
    -- Drop policies from members (default schema)
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'members' AND schemaname != 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON members';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies for members table
CREATE POLICY "anon_can_insert_members" ON members
    FOR INSERT TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "anon_can_register" ON members
    FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "authenticated_view_own" ON members
    FOR SELECT TO authenticated
    USING (email = auth.email());

CREATE POLICY "service_role_full_access" ON members
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- === PAYMENTS TABLE FIXES ===

-- Disable RLS temporarily for payments
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on payments table
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    -- Drop policies from public.payments
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'payments' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.payments';
    END LOOP;
    
    -- Drop policies from payments (default schema)
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'payments' AND schemaname != 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON payments';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create simple, working policies for payments table
CREATE POLICY "anon_can_create_payment" ON payments
    FOR INSERT TO anon 
    WITH CHECK (true);

CREATE POLICY "authenticated_view_own_payments" ON payments
    FOR SELECT TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM members 
        WHERE members.id = payments.member_id 
        AND members.email = auth.email()
    ));

CREATE POLICY "service_role_payments_full_access" ON payments
    FOR ALL TO service_role 
    USING (true) 
    WITH CHECK (true);

-- === GRANT NECESSARY PERMISSIONS ===

-- Grant table permissions to anon role
GRANT INSERT ON members TO anon;
GRANT INSERT ON payments TO anon;
GRANT SELECT ON members TO anon; -- Needed for foreign key validation
GRANT SELECT ON payments TO anon;

-- Grant to authenticated users
GRANT ALL ON members TO authenticated;
GRANT ALL ON payments TO authenticated;

-- Ensure service_role has full access
GRANT ALL ON members TO service_role;
GRANT ALL ON payments TO service_role;
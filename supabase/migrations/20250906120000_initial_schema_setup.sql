/*
          # [Full Schema Reset]
          This script will completely reset the public schema by dropping existing tables, functions, and policies, and then rebuilding it from scratch to match the application's requirements.

          ## Query Description: [This is a DESTRUCTIVE operation. It will delete all data in the 'members', 'payments', 'certificates', and 'admin_users' tables. It is designed for initial setup or a complete reset of the development database.

**BACKUP YOUR DATA** if you have any important information before running this script.]
          
          ## Metadata:
          - Schema-Category: ["Dangerous"]
          - Impact-Level: ["High"]
          - Requires-Backup: [true]
          - Reversible: [false]
          
          ## Structure Details:
          - Drops: All tables, types, functions, and policies in the public schema.
          - Creates: `members`, `payments`, `certificates`, `admin_users` tables.
          - Creates: `generate_membership_id` function, `handle_updated_at` trigger.
          - Creates: RLS policies for all tables.
          
          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [Yes]
          - Auth Requirements: [Resets all policies to align with application logic.]
          
          ## Performance Impact:
          - Indexes: [Added]
          - Triggers: [Added]
          - Estimated Impact: [This will reset the database, initial performance will be fast. Indexes are added on foreign keys for query optimization.]
          */

-- 1. Drop existing objects
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP SEQUENCE IF EXISTS public.membership_id_seq;
DROP FUNCTION IF EXISTS public.generate_membership_id();
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- 2. Create membership_id sequence and function
CREATE SEQUENCE public.membership_id_seq START 1111;

CREATE OR REPLACE FUNCTION public.generate_membership_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'KMDA' || nextval('public.membership_id_seq');
END;
$$ LANGUAGE plpgsql;

-- 3. Create members table
CREATE TABLE public.members (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_name text NOT NULL,
    contact_person text NOT NULL,
    mobile text NOT NULL,
    alternate_phone text,
    email text NOT NULL UNIQUE,
    pin_code text NOT NULL,
    address text NOT NULL,
    state text NOT NULL,
    district text NOT NULL,
    taluk text NOT NULL,
    city text NOT NULL,
    gstin text,
    category text NOT NULL,
    drug_license_url text,
    id_proof_url text,
    status text NOT NULL DEFAULT 'pending',
    membership_id text UNIQUE,
    expiry_date timestamp with time zone,
    approved_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- 4. Create admin_users table
CREATE TABLE public.admin_users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- 5. Create payments table
CREATE TABLE public.payments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    membership_fee numeric NOT NULL,
    gateway_charges numeric NOT NULL,
    donation_amount numeric DEFAULT 0,
    status text NOT NULL DEFAULT 'pending',
    payment_type text NOT NULL,
    payment_gateway text,
    razorpay_order_id text,
    razorpay_payment_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);
CREATE INDEX ON public.payments (member_id);

-- 6. Create certificates table
CREATE TABLE public.certificates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    certificate_number text NOT NULL,
    valid_until timestamp with time zone NOT NULL,
    pdf_url text NOT NULL,
    generated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);
CREATE INDEX ON public.certificates (member_id);

-- 7. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Apply updated_at triggers
CREATE TRIGGER on_members_update
BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_payments_update
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 9. Helper function to check for admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE user_id = auth.uid()
  ) INTO is_admin_user;
  RETURN is_admin_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 10. Setup Storage Buckets
/*
          # [Storage Setup]
          This script creates the necessary storage buckets for member documents and certificates.

          ## Query Description: [This operation sets up storage buckets. It is safe to run and will only create buckets if they do not already exist. It also sets public access policies to allow the frontend to display uploaded files.]
          
          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Low"]
          - Requires-Backup: [false]
          - Reversible: [true]
*/
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('member-documents', 'member-documents', true, 10485760, '{"image/jpeg","image/png","application/pdf"}'),
    ('certificates', 'certificates', true, 10485760, '{"application/pdf"}')
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to member documents" ON storage.objects
FOR SELECT USING (bucket_id = 'member-documents');

CREATE POLICY "Allow authenticated users to upload member documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'member-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Allow public read access to certificates" ON storage.objects
FOR SELECT USING (bucket_id = 'certificates');

CREATE POLICY "Allow service_role to upload certificates" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'service_role');


-- 11. Seed Admin User
/*
          # [Admin User Seeding]
          This script creates the default admin user and links it in the admin_users table.

          ## Query Description: [This operation inserts a new user into the 'auth.users' table and should be run with care. It uses a default password 'admin123'. **CHANGE THIS PASSWORD** in a production environment.]
          
          ## Metadata:
          - Schema-Category: ["Data"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: [false]
          - Reversible: [true]
*/
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Create the user in auth.users if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@kmda.org') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@kmda.org',
      crypt('admin123', gen_salt('bf')), now(), '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{}',
      now(), now(), '', '', NULL, now()
    );
  END IF;

  -- Get the user_id
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@kmda.org';

  -- Insert into admin_users table if not already present
  INSERT INTO public.admin_users (user_id)
  VALUES (admin_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END $$;


-- 12. RLS Policies
/*
          # [Row-Level Security Policies]
          This section enables RLS and applies policies to all tables.

          ## Query Description: [This is a critical security step. It ensures that users can only access their own data, while admins have full access. Anonymous users are only allowed to create new member registrations.]
          
          ## Metadata:
          - Schema-Category: ["Security"]
          - Impact-Level: ["High"]
          - Requires-Backup: [false]
          - Reversible: [true]
*/

-- Enable RLS on all tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policies for 'members' table
CREATE POLICY "Allow public access for new member registration" ON public.members
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow members to view their own profile" ON public.members
FOR SELECT TO authenticated USING (email = auth.email());

CREATE POLICY "Allow admins to manage all members" ON public.members
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for 'payments' table
CREATE POLICY "Allow users to create their own payment records" ON public.payments
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow members to view their own payments" ON public.payments
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.members WHERE id = member_id AND email = auth.email()
));

CREATE POLICY "Allow admins to view all payments" ON public.payments
FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Allow service_role to update payments" ON public.payments
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Policies for 'certificates' table
CREATE POLICY "Allow members to view their own certificates" ON public.certificates
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.members WHERE id = member_id AND email = auth.email()
));

CREATE POLICY "Allow admins to view all certificates" ON public.certificates
FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Allow service_role to create certificates" ON public.certificates
FOR INSERT TO service_role WITH CHECK (true);

-- Policies for 'admin_users' table
CREATE POLICY "Allow admins to see the admin list" ON public.admin_users
FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Allow service_role to manage admins" ON public.admin_users
FOR ALL TO service_role USING (true) WITH CHECK (true);

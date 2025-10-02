/*
  # Initial Schema Setup
  
  This migration creates the complete database schema for the KMDA membership management system.
  
  1. Tables Created
    - `members` - Stores member registration information
    - `payments` - Tracks membership fees and donations
    - `certificates` - Stores generated membership certificates
    - `admin_users` - Links auth users to admin privileges
  
  2. Security
    - Enables RLS on all tables
    - Allows public insert for member registration
    - Allows authenticated users to view their own data
    - Allows admins full access to all data
  
  3. Storage
    - Creates buckets for member documents and certificates
    - Sets up appropriate access policies
*/

-- 1. Drop existing objects
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.certificates CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.members CASCADE;
DROP SEQUENCE IF EXISTS public.membership_id_seq;
DROP FUNCTION IF EXISTS public.generate_membership_id();
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.is_admin();

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
    joined_at timestamp with time zone DEFAULT now(),
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

-- 7. Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    donor_name text NOT NULL,
    donor_email text NOT NULL,
    donor_mobile text NOT NULL,
    amount numeric NOT NULL,
    payment_gateway text,
    razorpay_order_id text,
    razorpay_payment_id text,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- 8. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Apply updated_at triggers
CREATE TRIGGER on_members_update
BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_payments_update
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_donations_update
BEFORE UPDATE ON public.donations
FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 10. Helper function to check for admin role
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

-- 11. Setup Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('member-documents', 'member-documents', true, 10485760, '{"image/jpeg","image/png","application/pdf"}'),
    ('certificates', 'certificates', true, 10485760, '{"application/pdf"}')
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read access to member documents" ON storage.objects
FOR SELECT USING (bucket_id = 'member-documents');

CREATE POLICY "Allow anyone to upload member documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'member-documents');

CREATE POLICY "Allow public read access to certificates" ON storage.objects
FOR SELECT USING (bucket_id = 'certificates');

CREATE POLICY "Allow service_role to upload certificates" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'certificates' AND auth.role() = 'service_role');

-- 12. Enable RLS on all tables
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies for members table
CREATE POLICY "Allow public insert for registration" ON public.members
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow members to view own profile" ON public.members
FOR SELECT TO authenticated USING (email = auth.email());

CREATE POLICY "Allow admins full access to members" ON public.members
FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 14. RLS Policies for payments table
CREATE POLICY "Allow public insert for payments" ON public.payments
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow members to view own payments" ON public.payments
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.members WHERE id = member_id AND email = auth.email()
));

CREATE POLICY "Allow admins to view all payments" ON public.payments
FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Allow service_role to update payments" ON public.payments
FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- 15. RLS Policies for certificates table
CREATE POLICY "Allow members to view own certificates" ON public.certificates
FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.members WHERE id = member_id AND email = auth.email()
));

CREATE POLICY "Allow admins to view all certificates" ON public.certificates
FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Allow service_role to create certificates" ON public.certificates
FOR INSERT TO service_role WITH CHECK (true);

-- 16. RLS Policies for admin_users table
CREATE POLICY "Allow admins to view admin list" ON public.admin_users
FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Allow service_role to manage admins" ON public.admin_users
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 17. RLS Policies for donations table
CREATE POLICY "Allow public insert for donations" ON public.donations
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Allow admins to view all donations" ON public.donations
FOR SELECT TO authenticated USING (public.is_admin());

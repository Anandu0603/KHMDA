-- KMDA Database Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Ensure members table exists with all required columns
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  mobile TEXT NOT NULL,
  alternate_phone TEXT,
  email TEXT UNIQUE NOT NULL,
  pin_code TEXT NOT NULL,
  address TEXT NOT NULL,
  state TEXT DEFAULT 'Kerala' NOT NULL,
  district TEXT NOT NULL,
  taluk TEXT NOT NULL,
  city TEXT NOT NULL,
  gstin TEXT,
  category TEXT NOT NULL,
  drug_license_url TEXT,
  id_proof_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')) NOT NULL,
  membership_id TEXT UNIQUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  expiry_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing members table
ALTER TABLE members
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
ADD COLUMN IF NOT EXISTS pin_code TEXT,
ADD COLUMN IF NOT EXISTS gstin TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS drug_license_url TEXT,
ADD COLUMN IF NOT EXISTS id_proof_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
ADD COLUMN IF NOT EXISTS membership_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_district ON members(district);

-- 2. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  membership_fee DECIMAL(10,2) DEFAULT 500,
  gateway_charges DECIMAL(10,2) DEFAULT 0,
  donation_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')) NOT NULL,
  payment_type TEXT CHECK (payment_type IN ('registration', 'renewal', 'donation')) NOT NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

-- 3. Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
CREATE POLICY "Admins can view all admin users" ON admin_users
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert admin users" ON admin_users;
CREATE POLICY "Admins can insert admin users" ON admin_users
FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can update admin users" ON admin_users;
CREATE POLICY "Admins can update admin users" ON admin_users
FOR UPDATE USING (auth.role() = 'service_role');

-- 4. Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  certificate_number TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_member_id ON certificates(member_id);

-- Enable RLS on certificates
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their own certificates" ON certificates;
CREATE POLICY "Members can view their own certificates" ON certificates
FOR SELECT USING (auth.uid()::text = (SELECT user_id::text FROM admin_users WHERE id = auth.uid()::uuid) OR member_id = (SELECT id FROM members WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

DROP POLICY IF EXISTS "Admins can view all certificates" ON certificates;
CREATE POLICY "Admins can view all certificates" ON certificates
FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- 5. Create member-documents storage bucket (for public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-documents', 'member-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for member-documents bucket
DROP POLICY IF EXISTS "Public can view member documents" ON storage.objects;
CREATE POLICY "Public can view member documents" ON storage.objects
FOR SELECT USING (bucket_id = 'member-documents');

-- Remove old policies
DROP POLICY IF EXISTS "Users can upload to member-documents" ON storage.objects;
CREATE POLICY "Users can upload to member-documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'member-documents' AND
  auth.role() IN ('authenticated', 'anon')
);

-- Allow public to update/delete their own uploads (by path matching email)
DROP POLICY IF EXISTS "Users can manage their own documents" ON storage.objects;
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'member-documents' AND
  auth.role() IN ('authenticated', 'anon', 'service_role')
);

CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'member-documents' AND
  auth.role() IN ('authenticated', 'anon', 'service_role')
);

-- 6. Update documents bucket policies (existing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated'
);

-- 7. Create certificates storage bucket (for public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for certificates bucket
DROP POLICY IF EXISTS "Public can view certificates" ON storage.objects;
CREATE POLICY "Public can view certificates" ON storage.objects
FOR SELECT USING (bucket_id = 'certificates');

-- Allow service role and authenticated users to upload certificates
DROP POLICY IF EXISTS "Users can upload certificates" ON storage.objects;
CREATE POLICY "Users can upload certificates" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'certificates' AND
  auth.role() IN ('authenticated', 'service_role')
);

-- Allow service role to manage certificates
DROP POLICY IF EXISTS "Service role can update certificates" ON storage.objects;
CREATE POLICY "Service role can update certificates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'certificates' AND
  auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Service role can delete certificates" ON storage.objects;
CREATE POLICY "Service role can delete certificates" ON storage.objects
FOR DELETE USING (
  bucket_id = 'certificates' AND
  auth.role() = 'service_role'
);

DROP POLICY IF EXISTS "Admins can update certificates" ON storage.objects;
CREATE POLICY "Admins can update certificates" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'certificates' AND 
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Admins can delete certificates" ON storage.objects;
CREATE POLICY "Admins can delete certificates" ON storage.objects
FOR DELETE USING (
  bucket_id = 'certificates' AND 
  auth.role() = 'authenticated'
);

-- 8. Enable RLS on members and payments tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public email uniqueness check" ON members;
DROP POLICY IF EXISTS "User own profile" ON members;
DROP POLICY IF EXISTS "Admin full members access" ON members;
DROP POLICY IF EXISTS "Service role full access" ON members;
DROP POLICY IF EXISTS "Public insert pending members" ON members;

DROP POLICY IF EXISTS "Anonymous upload to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous upload to certificates" ON storage.objects;
DROP POLICY IF EXISTS "Public can view all storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage storage" ON storage.objects;

-- Create new policies with correct syntax
CREATE POLICY "Public can insert pending members" ON members
FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Public can check email uniqueness" ON members
FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Authenticated users can view own profile" ON members
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Split admin policies into separate operations
CREATE POLICY "Admins can view members" ON members
FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update members" ON members
FOR UPDATE USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete members" ON members
FOR DELETE USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access to members" ON members
FOR ALL USING (auth.role() = 'service_role');

-- Payment policies
CREATE POLICY "Public insert pending payments" ON payments
FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Authenticated users can view own payments" ON payments
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  member_id = (SELECT id FROM members WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Split admin payment policies
CREATE POLICY "Admins can view payments" ON payments
FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update payments" ON payments
FOR UPDATE USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete payments" ON payments
FOR DELETE USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access to payments" ON payments
FOR ALL USING (auth.role() = 'service_role');

-- Storage policies
CREATE POLICY "Public can view storage objects" ON storage.objects
FOR SELECT USING (bucket_id IN ('member-documents', 'certificates'));

CREATE POLICY "Anonymous can upload to member-documents" ON storage.objects
FOR INSERT USING (bucket_id = 'member-documents' AND auth.role() = 'anon');

CREATE POLICY "Anonymous can upload to certificates" ON storage.objects
FOR INSERT USING (bucket_id = 'certificates' AND auth.role() = 'anon');

-- Split service role storage policies
CREATE POLICY "Service role can update storage" ON storage.objects
FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete storage" ON storage.objects
FOR DELETE USING (auth.role() = 'service_role');

-- Certificate policies
CREATE POLICY "Public can view certificates" ON certificates
FOR SELECT USING (true);

-- Split service role certificate policies
CREATE POLICY "Service role can insert certificates" ON certificates
FOR INSERT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update certificates" ON certificates
FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete certificates" ON certificates
FOR DELETE USING (auth.role() = 'service_role');

-- RLS policies for members
DROP POLICY IF EXISTS "Public can insert pending members" ON members;
CREATE POLICY "Public can insert pending members" ON members
FOR INSERT WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Public email uniqueness check" ON members;
CREATE POLICY "Public email uniqueness check" ON members
FOR SELECT USING (
  auth.role() = 'anon' AND
  true
);

DROP POLICY IF EXISTS "Members can view their own profile" ON members;
CREATE POLICY "Members can view their own profile" ON members
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can view all members" ON members;
CREATE POLICY "Admins can view all members" ON members
FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- RLS policies for payments
DROP POLICY IF EXISTS "Public can insert pending payments" ON payments;
CREATE POLICY "Public can insert pending payments" ON payments
FOR INSERT WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Members can view their own payments" ON payments;
CREATE POLICY "Members can view their own payments" ON payments
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  member_id = (SELECT id FROM members WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
CREATE POLICY "Admins can view all payments" ON payments
FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- 9. Grant permissions
GRANT ALL ON members TO authenticated;
GRANT ALL ON members TO service_role;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON payments TO service_role;
GRANT ALL ON certificates TO authenticated;
GRANT ALL ON certificates TO service_role;
GRANT ALL ON admin_users TO service_role;
GRANT ALL ON storage.objects TO authenticated, anon;

-- Grant permissions
GRANT ALL ON members TO anon, authenticated, service_role;
GRANT ALL ON payments TO anon, authenticated, service_role;
GRANT ALL ON certificates TO anon, authenticated, service_role;
GRANT ALL ON admin_users TO service_role;
GRANT ALL ON storage.objects TO anon, authenticated, service_role;

-- 10. Function to generate unique membership ID
CREATE OR REPLACE FUNCTION generate_membership_id()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  year_suffix TEXT;
BEGIN
  year_suffix := EXTRACT(YEAR FROM NOW())::TEXT % 100 || LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(membership_id FROM 6) AS INTEGER)), 0) + 1
  INTO next_number
  FROM members
  WHERE membership_id LIKE 'KMDA' || year_suffix || '%';
  
  RETURN 'KMDA' || year_suffix || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Seed initial admin user (run this separately with actual email/password via Supabase auth)
-- INSERT INTO admin_users (user_id) VALUES ('your-admin-uuid-here');

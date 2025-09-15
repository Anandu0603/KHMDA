-- Add missing columns to members table
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS contact_person TEXT,
ADD COLUMN IF NOT EXISTS alternate_phone TEXT,
ADD COLUMN IF NOT EXISTS pin_code TEXT,
ADD COLUMN IF NOT EXISTS gstin TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS drug_license_url TEXT,
ADD COLUMN IF NOT EXISTS id_proof_url TEXT;

-- Update status enum to include pending_approval
ALTER TYPE member_status RENAME TO member_status_old;
CREATE TYPE member_status AS ENUM ('pending', 'pending_approval', 'approved', 'rejected', 'expired');
ALTER TABLE members ALTER COLUMN status TYPE member_status USING status::text::member_status;
DROP TYPE member_status_old;

-- Create certificates table if it doesn't exist
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.role() = 'authenticated'
);

-- Grant necessary permissions
GRANT ALL ON certificates TO authenticated;
GRANT ALL ON certificates TO service_role;

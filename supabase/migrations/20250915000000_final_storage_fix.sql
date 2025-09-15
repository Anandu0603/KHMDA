/*
# [FINAL FIX] Storage Upload Permissions - Definitive Solution
This migration script provides a comprehensive fix for the "signature verification failed" error
during file uploads on the registration form.

## Key Issues Addressed:
1. Ensures the member-documents bucket exists and is properly configured
2. Sets correct RLS policies for anonymous uploads
3. Allows public read access for uploaded files
4. Provides admin access for document management

## This replaces all previous storage permission fixes
*/

--- Step 1: Ensure the member-documents bucket exists with correct configuration
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('member-documents', 'member-documents', true, 10485760, '{"image/jpeg","image/jpg","image/png","application/pdf"}')
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = '{"image/jpeg","image/jpg","image/png","application/pdf"}';

-- Step 2: Clean slate - Remove ALL existing policies for member-documents
DROP POLICY IF EXISTS "Allow anonymous uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload member documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to manage all member documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read access to member documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to member documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual access to own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin full access to documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads on member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads on member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from member-documents" ON storage.objects;

-- Step 3: Create the ONLY policies we need - simple and working

-- Policy 1: Allow anonymous users to upload files during registration
CREATE POLICY "anonymous_upload_member_documents"
ON storage.objects 
FOR INSERT 
TO anon 
WITH CHECK (bucket_id = 'member-documents');

-- Policy 2: Allow anyone to read files (needed for public URLs to work)
CREATE POLICY "public_read_member_documents"
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'member-documents');

-- Policy 3: Allow authenticated users (admins) to manage files
CREATE POLICY "authenticated_manage_member_documents"
ON storage.objects 
FOR ALL 
TO authenticated 
USING (bucket_id = 'member-documents')
WITH CHECK (bucket_id = 'member-documents');

-- Step 4: Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
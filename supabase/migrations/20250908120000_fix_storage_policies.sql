/*
# [Fix] Correct Storage RLS Policies

This migration script corrects a syntax error in a previous migration related to storage security policies. It drops any potentially conflicting old policies and creates a new, secure set of policies for the `member-documents` and `certificates` storage buckets.

## Query Description:
This operation will modify security policies on your Supabase Storage. It is designed to fix a previous error and establish the correct permissions for file uploads and access. It is a safe operation that does not affect existing data.

## Metadata:
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the new policies)

## Structure Details:
- Affects policies on the `storage.objects` table.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. This script explicitly defines who can upload and read files from your storage buckets, fixing a critical security flaw and a syntax error.
- Auth Requirements: Policies are based on `anon` and `authenticated` roles.
*/

-- Step 1: Clean up any previously created, potentially incorrect policies.
-- Use `DROP POLICY IF EXISTS` to avoid errors if they don't exist.
DROP POLICY IF EXISTS "Allow anon inserts on member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin reads on member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow member to read own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin access to certificates" ON storage.objects;
DROP POLICY IF EXISTS "Allow member to read own certificate" ON storage.objects;
DROP POLICY IF EXISTS "Admin permissions for member documents" ON storage.objects; -- Generic name for faulty policy


-- Step 2: Create correct policies for `member-documents` bucket.

-- Policy 1: Allow anonymous users to UPLOAD (insert) into 'member-documents'.
-- This is crucial for the public registration form.
CREATE POLICY "Allow anon inserts on member-documents"
ON storage.objects FOR INSERT TO anon
WITH CHECK ( bucket_id = 'member-documents' );

-- Policy 2: Allow authenticated users (admins) to VIEW (select) any document in 'member-documents'.
-- This is needed for the admin dashboard to review applications.
CREATE POLICY "Allow admin reads on member-documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'member-documents' AND
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  )
);

-- Policy 3: Allow authenticated users (members) to VIEW (select) THEIR OWN documents.
-- The file path is assumed to be `{user_email_slugified}/...`
CREATE POLICY "Allow member to read own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'member-documents' AND
  (storage.foldername(name))[1] = (
    SELECT regexp_replace(email, '[@.]', '_', 'g')
    FROM public.members
    WHERE email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
  )
);


-- Step 3: Create correct policies for `certificates` bucket.

-- Policy 1: Backend service role can UPLOAD (insert) certificates.
-- The `generate-certificate` function runs with the service_role key, so it bypasses RLS. No user-facing INSERT policy is needed.

-- Policy 2: Allow authenticated users (admins) to VIEW (select) any certificate.
CREATE POLICY "Allow admin access to certificates"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  )
);

-- Policy 3: Allow authenticated users (members) to VIEW (select) THEIR OWN certificate.
-- This policy checks if a certificate record exists linking the file to the logged-in member.
CREATE POLICY "Allow member to read own certificate"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'certificates' AND
  EXISTS (
    SELECT 1 FROM public.certificates c
    JOIN public.members m ON c.member_id = m.id
    WHERE c.pdf_url LIKE '%' || storage.objects.name
    AND m.email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
  )
);

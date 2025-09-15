/*
# [Fix] Storage Upload Permissions

This migration script corrects the Row-Level Security (RLS) policies for the `member-documents` storage bucket to resolve file upload failures during member registration.

## Query Description:
This script performs the following actions:
1.  **Drops all existing RLS policies** on the `storage.objects` table that are specific to the `member-documents` bucket. This ensures a clean slate and removes any conflicting rules.
2.  **Creates a new policy** that explicitly allows anonymous users (`anon` role) to upload files (`INSERT`) into the `member-documents` bucket. This is the primary fix for the "signature verification failed" error during registration.
3.  **Creates a new policy** that allows authenticated users to view (`SELECT`) their own documents. This ensures members can see their uploaded files on their profile.
4.  **Creates a new policy** that grants full access (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) to administrators on all files within the `member-documents` bucket.

These changes are safe and do not affect existing data. They only modify the security rules governing access to the files.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Affects RLS policies on the `storage.objects` table.
- Targets the `member-documents` bucket.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. This script modifies policies to grant necessary permissions for the application to function correctly while maintaining security boundaries between users.
- Auth Requirements: Policies are defined for `anon`, `authenticated`, and admin roles.
*/

-- Step 1: Drop existing policies for the 'member-documents' bucket to avoid conflicts.
-- Note: This will only drop policies if they exist. It will not error if they don't.
DROP POLICY IF EXISTS "Allow anonymous uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admin full access on member documents" ON storage.objects;
-- Dropping any other potential old policies by name if they were created in previous attempts
DROP POLICY IF EXISTS "Allow public anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads for anon" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;


-- Step 2: Create a policy to allow anonymous users to UPLOAD (INSERT) into the 'member-documents' bucket.
-- This is required for the public registration form.
CREATE POLICY "Allow anonymous uploads to member-documents"
ON storage.objects FOR INSERT
TO anon
WITH CHECK ( bucket_id = 'member-documents' );


-- Step 3: Create a policy for authenticated USERS to VIEW (SELECT) their own documents.
-- The documents are stored in a path like '{user_email_sanitized}/{file_name}'.
-- This policy checks if the first part of the path matches the logged-in user's sanitized email.
CREATE POLICY "Allow authenticated users to read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'member-documents' AND
  path_tokens[1] = replace(replace(auth.email(), '@', '_'), '.', '_')
);


-- Step 4: Create a policy to give ADMINS full access to all documents in the bucket.
-- This checks if the user's ID exists in the `public.admin_users` table.
CREATE POLICY "Admin full access on member documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'member-documents' AND
  (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
)
WITH CHECK (
  bucket_id = 'member-documents' AND
  (EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()))
);

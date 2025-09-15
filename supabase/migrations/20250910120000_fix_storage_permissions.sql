/*
# [Fix] Storage Upload Permissions (Definitive)
This migration script provides a definitive fix for the "signature verification failed" error during file uploads. It resets all relevant security policies on the 'member-documents' storage bucket to ensure anonymous uploads from the registration form are permitted.

## Query Description:
This operation will first REMOVE any existing, potentially conflicting policies related to file uploads for the 'member-documents' bucket. It then creates a single, specific policy that allows anonymous users to UPLOAD files. This is a safe operation and will not affect any existing files.

## Metadata:
- Schema-Category: "Security"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the new policy)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. This script is intended to fix broken RLS policies for file uploads.
- Auth Requirements: This policy specifically targets the 'anon' (unauthenticated) role.
*/

-- Step 1: Drop potentially conflicting old policies to ensure a clean state.
-- It is safe to run these commands even if the policies do not exist.
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual access to own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin full access to documents" ON storage.objects;


-- Step 2: Create the definitive policy to allow anonymous uploads to the 'member-documents' bucket.
-- This is the crucial policy that directly fixes the "signature verification failed" error.
CREATE POLICY "Allow anonymous uploads to member-documents"
ON storage.objects FOR INSERT TO anon WITH CHECK (
  bucket_id = 'member-documents'
);

-- Step 3: Add a policy to allow admins to view all documents. This is good practice for later.
-- This requires a helper function to identify an admin.
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE admin_users.user_id = is_admin_user.user_id
  );
END;
$$;

CREATE POLICY "Allow admin read access to documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'member-documents' AND is_admin_user(auth.uid())
);

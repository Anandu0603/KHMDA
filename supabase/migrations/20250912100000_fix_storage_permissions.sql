/*
# [Fix] Storage Upload Permissions (Definitive)
This script resets and correctly configures security policies for the 'member-documents' storage bucket to fix the "signature verification failed" error during file uploads.

## Query Description:
This operation will drop any existing policies on the 'member-documents' bucket and create new, correct ones. It is designed to be safe and will not affect existing data. The new policies will allow public uploads, which is necessary for the registration form, while restricting viewing access to authenticated users and admins.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true (by dropping the new policies)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes
- Auth Requirements: This grants `INSERT` permissions to anonymous users for the 'member-documents' bucket.
*/

-- 1. Drop all existing policies on the 'member-documents' bucket to ensure a clean slate.
DROP POLICY IF EXISTS "Allow public uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to view all documents" ON storage.objects;

-- 2. Create a policy to allow anonymous users to UPLOAD to the 'member-documents' bucket.
-- This is essential for the public registration form.
CREATE POLICY "Allow public uploads to member-documents"
ON storage.objects FOR INSERT TO anon
WITH CHECK ( bucket_id = 'member-documents' );

-- 3. Create a policy to allow AUTHENTICATED users (members) to view their OWN files.
-- This uses `owner = auth.uid()` which is automatically set by Supabase on upload.
CREATE POLICY "Allow authenticated users to view their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'member-documents' AND
  owner = auth.uid()
);

-- 4. Create a policy to allow ADMINS to view ALL files in the bucket.
-- This checks if the currently authenticated user's ID exists in the `admin_users` table.
CREATE POLICY "Allow admins to view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'member-documents' AND
  (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
  )
);

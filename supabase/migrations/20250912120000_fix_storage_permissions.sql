/*
# [Fix] Storage Upload Permissions

This script resets and correctly configures the security policies for the `member-documents` storage bucket.
It is designed to finally resolve the "signature verification failed" error during file uploads on the public registration form.

## Query Description:
This operation will:
1. Drop all potentially conflicting old policies on the storage bucket.
2. Ensure the `member-documents` bucket is public, which simplifies URL generation.
3. Create a specific, new policy to allow anonymous users to upload files.
4. Create a policy to allow authenticated admins to view and manage these files.
This is a safe, non-destructive operation for your data, but it is critical for fixing the upload functionality.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Affects policies on `storage.objects`.
- Affects `public` property on `storage.buckets`.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. This script explicitly grants `INSERT` access to the `anon` role for the `member-documents` bucket, which is necessary for the public registration form to work. It also grants `SELECT`, `UPDATE`, and `DELETE` access to authenticated users (admins).
- Auth Requirements: None for upload, `authenticated` role for management.
*/

-- Step 1: Drop all potentially conflicting old policies to ensure a clean slate.
-- This is crucial to prevent old rules from interfering with the new ones.
DROP POLICY IF EXISTS "Allow anonymous uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to manage all documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads for anon" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated user to read files" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to manage all member documents" ON storage.objects;


-- Step 2: Ensure the `member-documents` bucket is public.
-- This allows `getPublicUrl` to work correctly without needing signed URLs.
UPDATE storage.buckets
SET public = TRUE
WHERE id = 'member-documents';


-- Step 3: Create a new policy to allow ANYONE (anonymous users) to upload to the `member-documents` bucket.
-- This is the key policy that fixes the registration form upload error.
CREATE POLICY "Allow anonymous uploads to member-documents"
ON storage.objects FOR INSERT
TO anon
WITH CHECK ( bucket_id = 'member-documents' );


-- Step 4: Create a policy that allows authenticated users (i.e., logged-in admins) to view, update, and delete any file in the bucket.
-- This is necessary for admins to manage uploaded documents.
CREATE POLICY "Allow admins to manage all member documents"
ON storage.objects FOR SELECT, UPDATE, DELETE
TO authenticated
USING ( bucket_id = 'member-documents' );

/*
# [SECURITY] Reset and Fix Storage Permissions for 'member-documents'

This migration script resets all security policies for the `member-documents` storage bucket and applies a new, correct set of rules. This is intended to fix the "signature verification failed" error during file uploads on the public registration form.

## Query Description:
This operation will drop all existing Row-Level Security (RLS) policies on the `storage.objects` table that apply to the `member-documents` bucket and recreate them.
- **`INSERT`:** Allows anonymous users to upload files, which is necessary for the registration form.
- **`SELECT`:** Allows public read access to all files in the bucket. This is required for the application to display the documents using their public URLs. The URLs are unguessable, but the files are technically public.
- **`UPDATE`/`DELETE`:** Restricted to administrators (via `service_role`), preventing unauthorized modification or deletion of documents.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true (by dropping these policies and creating new ones)

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. This script makes files in the `member-documents` bucket publicly readable via their URL.
- Auth Requirements: `anon` role is granted INSERT and SELECT. `service_role` is granted UPDATE and DELETE.
*/

-- Step 1: Drop all existing policies for the 'member-documents' bucket to ensure a clean slate.
-- This prevents conflicts with any old or incorrect policies.
DROP POLICY IF EXISTS "Allow anonymous uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to manage all documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins full access to member-documents" ON storage.objects;


-- Step 2: Create a policy to allow anonymous (public) users to UPLOAD files.
-- This is CRITICAL for the registration form to work.
CREATE POLICY "Allow anonymous uploads to member-documents"
ON storage.objects FOR INSERT TO anon
WITH CHECK ( bucket_id = 'member-documents' );


-- Step 3: Create a policy to allow public READ access to the files.
-- This is necessary for the application to display the documents using their public URLs.
CREATE POLICY "Allow public read access to member-documents"
ON storage.objects FOR SELECT TO anon
USING ( bucket_id = 'member-documents' );


-- Step 4: Create a policy to allow admins (service_role) to UPDATE and DELETE files.
-- This restricts modification and deletion to backend processes or admin-level access.
CREATE POLICY "Allow admins to manage all documents"
ON storage.objects FOR UPDATE, DELETE
USING ( auth.role() = 'service_role' AND bucket_id = 'member-documents' );

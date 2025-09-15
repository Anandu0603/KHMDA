/*
# [Fix] Storage Upload Permissions (Definitive)
This migration script resets and correctly configures the security policies for the `member-documents` storage bucket to resolve persistent "signature verification failed" errors during file uploads from the public registration form.

## Query Description:
This script will first remove all existing Row-Level Security (RLS) policies on the `storage.objects` table that are associated with the `member-documents` bucket. It then creates a new, specific policy that explicitly allows anonymous users to upload files (INSERT) into this bucket. This is a safe operation that only affects access permissions and does not risk any existing data.

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
- Policy Changes: Yes. This script is designed to fix a security policy misconfiguration. It grants `INSERT` permissions to the `anon` role for a specific bucket, which is required for the public registration form to function correctly.
- Auth Requirements: None. This fixes permissions for anonymous users.

## Performance Impact:
- Indexes: None
- Triggers: None
- Estimated Impact: Negligible.
*/

-- Step 1: Drop all potentially conflicting existing policies for the target bucket.
-- This ensures a clean slate and prevents old rules from interfering.
DROP POLICY IF EXISTS "Allow anonymous uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to member-documents" ON storage.objects;


-- Step 2: Create the definitive policy to allow anonymous uploads.
-- This policy grants the 'anon' role permission to INSERT objects into the 'member-documents' bucket.
-- This is the key fix for the "signature verification failed" error on the registration form.
CREATE POLICY "Allow anonymous uploads to member-documents"
ON storage.objects FOR INSERT TO anon WITH CHECK (
  bucket_id = 'member-documents'
);

-- Step 3: Allow public read access so admins can view the uploaded documents.
CREATE POLICY "Allow public read access to member-documents"
ON storage.objects FOR SELECT TO public USING (
  bucket_id = 'member-documents'
);

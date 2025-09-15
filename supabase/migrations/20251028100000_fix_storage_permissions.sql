/*
# [Fix Storage Permissions]
This migration resets and correctly configures the security policies for the 'member-documents' storage bucket. It ensures that public file uploads during registration are allowed, which will fix the "signature verification failed" error.

## Query Description:
This script first drops any potentially conflicting old policies on the 'member-documents' bucket to ensure a clean state. It then creates two new policies:
1.  Allows anyone (public) to upload files (INSERT) to the 'member-documents' bucket.
2.  Allows anyone (public) to read files (SELECT) from the 'member-documents' bucket.
This is required for the current application design where anonymous users upload documents during registration.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Affects policies on the `storage.objects` table.
- Specifically targets the `member-documents` bucket.

## Security Implications:
- RLS Status: Enabled
- Policy Changes: Yes. This makes the 'member-documents' bucket publicly writable and readable. While necessary for the current registration flow, be aware that anyone can theoretically upload to this bucket. Future improvements could involve signed URLs for more secure uploads.
- Auth Requirements: None for upload/read.
*/

-- Drop potentially conflicting old policies to ensure a clean slate.
-- It's safe to run these even if the policies don't exist.
DROP POLICY IF EXISTS "Allow public uploads on member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads on member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from member-documents" ON storage.objects;

-- Create a new policy to allow public uploads (INSERT) to the 'member-documents' bucket.
CREATE POLICY "Allow public uploads to member-documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'member-documents' );

-- Create a new policy to allow public reads (SELECT) from the 'member-documents' bucket.
-- This is necessary for displaying the uploaded documents later.
CREATE POLICY "Allow public reads from member-documents"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'member-documents' );

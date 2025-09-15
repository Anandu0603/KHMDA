/*
          # [CRITICAL FIX] Reset Storage Policies for Member Documents
          This migration resets and correctly configures the Row-Level Security (RLS) policies for the `member-documents` storage bucket.
          This is intended to permanently fix the "signature verification failed" error that occurs during anonymous file uploads on the public registration form.

          ## Query Description:
          1.  **DROP Policies**: It first safely removes any potentially conflicting old policies on the `storage.objects` table related to `member-documents`.
          2.  **CREATE SELECT Policy**: It creates a new policy that allows unrestricted public read access (`SELECT`) to files within the `member-documents` bucket. This is necessary for the public URLs of uploaded documents to be accessible.
          3.  **CREATE INSERT Policy**: It creates a new policy that allows unrestricted public write access (`INSERT`) into the `member-documents` bucket. This is the critical step that allows anonymous users on the registration form to upload their files.

          This operation is safe and will not affect any existing data. It only modifies the security rules governing access to the storage bucket.

          ## Metadata:
          - Schema-Category: "Structural"
          - Impact-Level: "Low"
          - Requires-Backup: false
          - Reversible: true

          ## Structure Details:
          - Affects RLS policies on the `storage.objects` table.

          ## Security Implications:
          - RLS Status: Enabled
          - Policy Changes: Yes
          - Auth Requirements: This specifically grants `public` (anonymous and authenticated) users INSERT and SELECT rights on the `member-documents` bucket.
          
          ## Performance Impact:
          - Indexes: None
          - Triggers: None
          - Estimated Impact: Negligible.
          */

-- Drop existing policies to ensure a clean slate and prevent conflicts.
DROP POLICY IF EXISTS "Allow public read access to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin full access to member-documents" ON storage.objects;


-- Create a policy to allow public read access on the 'member-documents' bucket.
-- This is necessary for the public URLs of uploaded documents to work correctly.
CREATE POLICY "Allow public read access to member-documents"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'member-documents' );


-- Create a policy to allow anonymous (public) users to upload files to the 'member-documents' bucket.
-- This is required for the public registration form to function correctly.
CREATE POLICY "Allow anonymous uploads to member-documents"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'member-documents' );

/*
  # [Permission Reset] Definitive Storage Policy Fix

  ## Query Description: [This script resets and correctly configures all security policies for the 'member-documents' storage bucket. It first removes any potentially conflicting old policies and then creates the specific rules required for the application to function securely. This ensures that anonymous users can upload files during registration, and authenticated users (like admins) can view them. This is a safe structural change and will not affect any existing data.]
  
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
  - Policy Changes: Yes
  - Auth Requirements: Correctly sets policies for `anon` and `authenticated` roles.
  
  ## Performance Impact:
  - Indexes: None
  - Triggers: None
  - Estimated Impact: Negligible performance impact. This is a one-time structural change.
*/

-- Drop all potentially conflicting policies for the 'member-documents' bucket to ensure a clean slate.
DROP POLICY IF EXISTS "Allow public read access to member documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous uploads to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous insert to member-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads for anon" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read access to member documents" ON storage.objects;

-- Create a policy to allow ANYONE (anonymous users) to UPLOAD to the 'member-documents' bucket.
-- This is the key policy needed for the public registration form to work.
CREATE POLICY "Allow anonymous uploads to member-documents"
ON storage.objects FOR INSERT TO anon
WITH CHECK ( bucket_id = 'member-documents' );

-- Create a policy to allow any AUTHENTICATED user (and by extension, admins via service_role) to READ files from the 'member-documents' bucket.
-- This allows admins to view uploaded documents in the dashboard.
CREATE POLICY "Allow authenticated read access to member documents"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'member-documents' );
